var args = process.argv.slice(2),
    express = require('express'),
    app = express.createServer(),
    config = require('./config.js'),
    skripts = require('./lib/skript.js').loadAllSkripts(config.skriptsPath);


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

app.get('/', function(req, res) {
     res.send(JSON.stringify(skripts));
});

app.listen(config.port, config.host);

var theaters = {
    irc: require('./lib/irctheater.js')
};

var theater = theaters.irc.getTheater();

var skript = skripts[0];
theater.setup(skript.setup, function(){
    theater.run(skript.skript);
});
