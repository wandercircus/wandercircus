require.paths.unshift(__dirname + '/node_modules/express/node_modules'); // wtf-fix

require('nko')('L+FRhsyUr5+PPVlu');

var path    = require('path'),
    express = require('express'),
    connect = require('connect'),
    app     = express.createServer(),
    io      = require('socket.io').listen(app);


io.configure('production', function(){
    io.set('transports', [
    , 'xhr-polling'
    , 'jsonp-polling'
    , 'flashsocket'
    , 'htmlfile'
    ]);
    io.enable('browser client minification');  // send minified client
    io.enable('browser client etag');          // apply etag caching logic based on version number
    io.set('log level', 1);
});
io.configure('development', function(){
    io.set('transports', [
    , 'xhr-polling'
    , 'jsonp-polling'
    , 'flashsocket'
    , 'htmlfile'
    ]);
    io.set('log level', 2);
});


var config      = require('./config.js'),
    utils       = require('./lib/utils.js'),
    currentShow = require('./lib/show.js'),
    skripts     = require('./lib/skript.js').loadAllSkripts(config.skriptsPath),
    votes       = {},
    SHOW_INTERVAL = config.showInterval,
    sessionStore = new express.session.MemoryStore();

var args = process.argv.slice(2);

var theaters = {
    irc: require('./lib/irctheater.js')
};

app.configure(function(){
    app.use(express.cookieParser());
    app.use(express.session({ store: sessionStore, secret: config.sessionSecret }));
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
});

app.configure('development', function() {
    app.use(express.static(__dirname + '/static'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    
    app.get('/__trigger__', function(req, res) {
      nextShow();
      res.send("");
    });
});

app.configure('production', function() {
  var oneYear = 31557600000;
  app.use(express.static(__dirname + '/static', { maxAge: oneYear }));
  app.use(express.errorHandler());
});

app.get('/api/theatres', function(req, res) {
  res.send(JSON.stringify(theaters));
});

app.get('/api/skripts', function(req, res) {
  res.send(JSON.stringify(utils.massageSkripts(skripts)));
});

app.post('/api/vote/:id', function(req, res) {
    skript = skripts[req.params.id];

    if (!skript) {
        res.send(404);
        return;
    }
    var voteId = req.session.voteId;
    if (process.env.NODE_ENV === 'production' && voteId) {
        res.send(403);
        return;
    }

    skript.votes += 1;
    // todo: test channel via regex
    if (!skript.nextShowChannel && req.body && req.body.channel) {
      skript.nextShowChannel = req.body.channel;
    }
    utils.calculateVotePercentage(skripts);
    emitVotes(io.sockets);

    req.session.voteId = req.params.id;

    res.send(200);
});

function emitVotes(socket) {
    socket.emit('votes', utils.stripForVotes(skripts));
}

function getVoteId(request, cb) {
    var cookieString = (request && request.headers.cookie) || "";
    var parsedCookies = connect.utils.parseCookie(cookieString);
    var sid = parsedCookies['connect.sid'];
    if (sid) {
      sessionStore.get(sid, function (error, session) {
        session && cb(session.voteId);
      });
    }
}

app.get('/', function(req, res) {
  res.sendfile(path.join(__dirname, 'static', 'index.html'));
});

app.listen(config.port, config.host);

io.sockets.on('connection', function(socket) {
    emitShowTimes(socket);
    getVoteId(socket.handshake, function(voteId) {
        socket.emit('my vote', voteId || null);
    });
});

var showTimeout = null;
var nextShowTime = Date.now() + SHOW_INTERVAL;

function nextShow() {
    clearTimeout(showTimeout);
    var skript, winnerSkript, maxVotes = 0;
    for (var id in skripts) {
        skript = skripts[id];
        if  (skript.votes > maxVotes) {
            winnerSkript = skript;
            maxVotes = skript.votes;
        }
        skript = null;
    }
    if (winnerSkript) {
        console.log("Starting scheduled show, winner is ", winnerSkript.title);
        var theater = theaters.irc.getTheater();
        // TODO pick channel
        currentShow.startShow(theater, winnerSkript, function() {
            resetVotes();
            scheduleShow(15);
        }, function doneClb() {
            emitShowTimes(io.sockets);
        });
    } else {
        console.log("No votes, no show.");
        scheduleShow(15);
    }
}

function scheduleShow(timeDelay) {
    clearTimeout(showTimeout);
    if (timeDelay && nextShowTime) {
        // Schedule timeDelay minutes later than currently
        nextShowTime.setMinutes(nextShowTime.getMinutes() + 15);
    } else {
        // Schedule to the next full 15 minutes
        nextShowTime = new Date();
        nextQuarterH = nextShowTime.getMinutes();
        nextQuarterH -= (nextQuarterH % 15) - 15;
        nextShowTime.setMinutes(nextQuarterH);
        nextShowTime.setSeconds(0); nextShowTime.setMilliseconds(0);
    }
    showTimeout = setTimeout(nextShow, Math.max(nextShowTime - Date.now(), 0));
    console.log("Scheduled show for ", new Date(nextShowTime));
    emitShowTimes(io.sockets);
}

scheduleShow();

function emitShowTimes(socket) {
    socket.emit('show times', {
        'current': currentShow.export(), 
        'next': nextShowTime
    });
}

function resetVotes() {
    for (var id in skripts) {
        skripts[id].votes = 0;
        skripts[id].votePercentage = 0;
        skripts[id].nextShowChannel = null;
    }
    sessionStore.clear(function() {
        io.sockets.emit("my vote", null);
        emitVotes(io.sockets);
    });
}


if (args.length > 0){
    console.log("Running with", args[0]);
    var theater = theaters.irc.getTheater();
    var play = skripts[args[0].replace(/\./, '_')];
    if (args[1]){
        console.log("Cut to", args[1]);
        play.skript = play.skript.slice(parseInt( args[1] || 0, 10));
    }

    if (play) {
      currentShow.startShow(theater, play, function(){
          theater.run(play.skript);
      }, function() {
          console.log("Done callback: skript finished.")
      });
    } else {
      console.log("Skript " + args[0] + " does not exist");
      process.exit();
    }
}
