require.paths.unshift(__dirname + '/node_modules/express/node_modules'); // wtf-fix

require('nko')('L+FRhsyUr5+PPVlu');

var path    = require('path'),
    express = require('express'),
    connect = require('connect'),
    app     = express.createServer(),
    io      = require('socket.io').listen(app);

io.enable('browser client minification');  // send minified client
io.enable('browser client etag');          // apply etag caching logic based on version number

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
  res.send(JSON.stringify(utils.stripSkripts(skripts)));
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
    if (!skript.channel && req.body && req.body.channel) {
      skript.channel = req.body.channel;
    }
    utils.calculateVotePercentage(skripts);
    io.sockets.emit('votes', utils.stripForVotes(skripts));

    req.session.voteId = req.params.id;

    res.send(200);
});

function getVoteId(request, cb) {
    var cookieString = (request && request.headers.cookie) || "";
    var parsedCookies = connect.utils.parseCookie(cookieString);
    var sid = parsedCookies['connect.sid'];
    if (sid) {
      sessionStore.get(sid, function (error, session) {
        cb(session.voteId);
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
        if (voteId) socket.emit('my vote', voteId);
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
    }
    if (winnerSkript) {
        console.log("Starting scheduled show, winner is ", skript.title);
        var theater = theaters.irc.getTheater();
        // TODO pick channel
        currentShow.startShow(theater, skript, function() {
            scheduleShow();
        });
    } else {
        console.log("No votes, no show.");
        scheduleShow();
    }
}

function scheduleShow() {
    clearTimeout(showTimeout);
    nextShowTime = new Date();
    nextQuarterH = nextShowTime.getMinutes();
    nextQuarterH -= (nextQuarterH % 15) - 15;
    nextShowTime.setMinutes(nextQuarterH);
    showTimeout = setTimeout(nextShow, Math.max(nextShowTime - Date.now(), 0));
    console.log("Scheduled show for ", new Date(nextShowTime));
    emitShowTimes(io.sockets);
}

scheduleShow();

function emitShowTimes(socket) {
    socket.emit('show times', {
        'current': currentShow.toJSON(), 
        'next': nextShowTime
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
    theater.setup(play.setup, function(){
        theater.run(play.skript);
    });
}
