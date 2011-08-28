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
    skripts     = require('./lib/skript.js').loadAllSkripts(config.skriptsPath);
    votes       = {};

var args = process.argv.slice(2);

var theaters = {
    irc: require('./lib/irctheater.js')
};

app.configure(function(){
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
    if (!skripts[req.params.id]) {
        res.send(404);
        return;
    }

    var voteId = getVoteId(req);
    if (process.env.NODE_ENV === 'production' && voteId) {
        res.send(403);
        return;
    }

    skripts[req.params.id].votes += 1;
    utils.calculateVotePercentage(skripts);
    io.sockets.emit('votes', utils.stripForVotes(skripts));

    res.cookie('vote_id', req.params.id, { });

    res.send(200);
});

function getVoteId(request) {
    var cookieString = (request && request.headers.cookie) || "";
    var parsedCookies = connect.utils.parseCookie(cookieString);
    return parsedCookies['vote_id'];
}

app.get('/', function(req, res) {
  res.sendfile(path.join(__dirname, 'static', 'index.html'));
});

app.listen(config.port, config.host);

io.sockets.on('connection', function(socket) {
    socket.emit('current show', currentShow.toJSON());
    var voteId = getVoteId(socket.request);
    if (voteId)
        socket.emit('my vote', voteId);
});

if (args.length > 0){
    console.log("Running with", args[0]);
    var theater = theaters.irc.getTheater();
    var play = skripts[args[0].replace('\.', '_')];
    if (args[1]){
        console.log("Cut to", scene);
        play.skript = play.skript.slice(parseInt( args[1] || 0, 10));
    }
    theater.setup(play.setup, function(){
        theater.run(play.skript);
    });
}
