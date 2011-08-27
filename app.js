var args = process.argv.slice(2);
    app = require('express').createServer(),
    config = require('./config.js');
    debugger;
var    skripts = require('./lib/skript.js').loadAllSkripts(config.skriptsPath);
    
app.get('/', function(req, res){
     res.send(JSON.stringify(skripts));
   });

app.listen(config.port, config.host);

var theaters = {
    irc: require('./lib/irctheater.js')
};

var theater = theaters.irc.getTheater();

var configFile = args.length > 0 ? args[0] : "example";

var skript = Skript(configFile);
theater.setup(skript.setup, function(){
    theater.run(skript.skript);
});
