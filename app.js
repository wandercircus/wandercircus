var args = process.argv.slice(2);
    app = require('express').createServer(),
    config = require('./config.js');
    debugger;
var    skripts = require('./lib/skript.js').loadAllSkripts(config.skriptsPath);
    
// var theaters = {
//     irc: require('./lib/irctheatre.js')
// };
// 
// var theater = theatres.irc.getTheater();

app.get('/', function(req, res){
     res.send(JSON.stringify(skripts));
   });

app.listen(config.port, config.host);


// readJSONFile(configFile, function(data){
//     theater.setup(data.setup, function(){
//         console.log("everybody in");
//         theater.run(data.script);
//     });
// });