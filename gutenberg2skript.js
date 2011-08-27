var args = process.argv.slice(2),
    fs = require('fs'),
    sys = require('sys'),
    yaml = require('yamlparser');


var lines = fs.readFileSync(args[0]).toString().split("\n");
var len = lines.length, line;

var actors = {
    "Claudius": "Claudius, King of Denmark.",
    "Hamlet": "Hamlet, Son to the former, and Nephew to the present King.",
    "Polonius": "Polonius, Lord Chamberlain.",
    "Horatio": "Horatio, Friend to Hamlet.",
    "Laertes": "Laertes, Son to Polonius.",
    "Voltimand": "Voltimand, Courtier.",
    "Cornelius": "Cornelius, Courtier.",
    "Rosencrantz": "Rosencrantz, Courtier.",
    "Guildenstern": "Guildenstern, Courtier.",
    "Osric": "Osric, Courtier.",
    "Gentleman": "Gentleman, Courtier.",
    "Priest": "Priest.",
    "Marcellus": "Marcellus, Officer.",
    "Barnardo": "Bernardo, Officer.",
    "Francisco": "Francisco, a Soldier",
    "Reynaldo": "Reynaldo, Servant to Polonius.",
    "Player": "Players.",
    "Clown": "Clowns",
    "GraveDigger": "Grave-diggers.",
    "Fortinbras": "Fortinbras, Prince of Norway.",
    "Captain": "Captain.",
    "Ambassador": "Ambassadors.",
    "Ghost": "Ghost of Hamlet's Father.",
    "Gertrude": "Gertrude, Queen of Denmark, and Mother of Hamlet.",
    "Ophelia": "Ophelia, Daughter to Polonius."
};

director = "director";

var findActor = function(name){
    var matcher = new RegExp("^"+name);
    for (var actor in actors){
        if (matcher.test(actor)){
            return actor;
        }
    }
    return undefined;
};

var findActorsInLine = function(line){
    var parts = line.trim().split(" "), part;
    var resultActor, result = [];
    for (var i=0; i<parts.length; i+=1){
        part = parts[i].replace(/[^\w]/g, "");
        resultActor = findActor(part);
        if (resultActor !== undefined){
            result.push(resultActor);
        }
    }
    return result;
};

var config = {
    setup: {
      author: "Shakespeare",
      irc: {
        server: "irc.mysociety.org",
        channel: "#nodespeare"
      },
      prefix: "asdf|"
    },
    skript: []
};

config.setup.actors = [];
for (var ac in actors){
    config.setup.actors.push({id: ac, name: actors[ac]});
}

var currentActor;
var stagedActors = [];

var lastLineWhiteSpace = false;

for (var i = 0; i < len; i += 1){
    line = lines[i];
    if (line.length === 0){
        lastLineWhiteSpace = true;
        currentActor = undefined;
        continue;
    }
    lastLineWhiteSpace = false;
    if (config.setup.title === undefined){
        config.setup.title = line;
        continue;
    }
    if (/^Actus/.test(line) || /^Scena/.test(line)){
        config.skript.push({
            action: "announcement",
            content: line
        });
        continue;
    }
    if (/^Enter/.test(line)){
        config.skript.push({
            action: "announcement",
            content: line
        });
        var enteringActors = findActorsInLine(line);
        stagedActors = enteringActors.slice();
        config.skript.push({
            action: "enter",
            actors: enteringActors
        });
        continue;
    }
    if (/^Exit/.test(line) || /^Exeunt/.test(line)){
        config.skript.push({
            action: "announcement",
            content: line
        });
        if (/^Exeunt/.test(line)){
            config.skript.push({
                action: "exit",
                actors: stagedActors.slice()
            });
        } else {
            var exitingActors = findActorsInLine(line);
            config.skript.push({
                action: "exit",
                actors: exitingActors
            });
        }
        continue;
    }
    if (/^FINIS/.test(line)){
        config.skript.push({
            action: "announcement",
            content: line
        });
        continue;
    }
    var text;
    if (/^\s+/.test(line)){
        var parts = line.split(".");
        var name = parts[0].trim();
        var actor = findActor(name);
        if (actor){
            currentActor = actor;
        } else {
            currentActor = undefined;
        }
        text = parts[1].trim();
    } else {
        text = line.trim();
    }
    if (currentActor){
        config.skript.push({
            action: "speak",
            actor: currentActor,
            line: text
        });
    } else {
        config.skript.push({
            action: "announcement",
            content: text
        });
    }
}

sys.puts(JSON.stringify(config, null, " "));
