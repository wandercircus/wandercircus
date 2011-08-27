var fs = require('fs'),
    args = process.argv.slice(2);


var theaters = {
    irc: require('./lib/irctheatre.js')
};

var readFile = function(file, clb) {
    var stream = fs.createReadStream(file);
    var data = "";
    stream.on("data", function(d){
        data += d;
    });
    stream.on("end", function(){
        clb(data);
    });
};


var readJSONFile = function(file, clb){
    readFile(file, function(data){
        clb(JSON.parse(data));
    });
};

var theater = theatres.irc.getTheater();

var configFile = args.length > 0 ? args[0] : "config.json";

readJSONFile(configFile, function(data){
    theater.setup(data.setup, function(){
        console.log("everybody in");
        theater.run(data.script);
    });
});

// var irc = require('irc');

// var serverList = ['irc.efnet.org', 'irc.oftc.net', 'irc.freenode.org'];
// var server = serverList[0];

// console.log(server);

// var client = new irc.Client(server, "actor3", {
//     userName: 'nodeshakespearebot',
//     realName: 'nodeJS IRC client',
//     port: 6667,
//     debug: true,
//     showErrors: true,
//     autoRejoin: true,
//     autoConnect: true,
//     channels: ["#nodespeare"],
//     secure: false
// });
// client.addListener('error', function(message) {
//     console.error('ERROR: %s: %s', message.command, message.args.join(' '));
// });

// client.join("#nodespeare", function(){
//     console.log("join");
//     client.say("#nodespeare", "blub");
// });
// console.log("nonblocking");
