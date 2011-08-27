var path    = require('path'),
    express = require('express'),
    app     = express.createServer(),
    io      = require('socket.io').listen(app);

var config      = require('./config.js'),
    currentShow = require('./lib/show.js'),
    skripts     = require('./lib/skript.js').loadAllSkripts(config.skriptsPath);

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
  res.send(JSON.stringify(skripts));
});

app.post('/api/start/:id', function(req, res) {
  //currentShow.startShow(theaters.irc.getTheater(), skripts[req.params.id], function() {
    //io.sockets.emit('current show', currentShow.toJSON());
  //});
  res.send("");
});

app.get('/', function(req, res) {
  res.sendfile(path.join(__dirname, 'static', 'index.html'));
});

app.listen(config.port, config.host);

io.sockets.on('connection', function(socket) {
    socket.emit('current show', currentShow.toJSON()); 
});

if (args.length > 0){
    console.log("Running with", args[0]);
    var theater = theaters.irc.getTheater();
    var hamlet = skripts[args[0]];
    theater.setup(hamlet.setup, function(){
        theater.run(hamlet.skript);
    });
}
