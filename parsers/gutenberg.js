var args = process.argv.slice(2),
    fs = require('fs'),
    sys = require('sys'),
    jsdom = require('jsdom');

var html = fs.readFileSync('html/hamlet.html').toString();


var actors = {
    "KingClaudius": "Claudius, King of Denmark.",
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
    "Bernardo": "Bernardo, Officer.",
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



var win, skript = [], stagedActors = [];

var addToStaged = function(list){
    for (var i = 0; i < list.length; i += 1){
        var found = false;
        for (var j = 0; j < stagedActors.length; j += 1){
            if (list[i] === stagedActors[j]){
                found = true;
                break;
            }
        }
        if (!found){
            stagedActors.push(list[i]);
        }
    }
};

var removeFromStaged = function(list){
    var newStaged = [];
    for (var j = 0; j < stagedActors.length; j += 1){
        var found = false;
        for (var i = 0; i < list.length; i += 1){
            if (list[i] === stagedActors[j]){
                found = true;
                break;
            }
        }
        if (!found){
            newStaged.push(stagedActors[j]);
        }
    }
    stagedActors = newStaged;
};



jsdom.env({
  html: html,
  scripts: [
    'http://code.jquery.com/jquery-1.5.min.js'
  ]
}, function (err, window) {
    win = window;
    var $ = window.jQuery;
    var children = window.document.body.children;
    var children_length = children.length, child,
        tagName, text, textParts, actorBefore;
    for(var i = 0; i < children_length; i += 1){
        child = children[i];
        tagName = child.tagName.toLowerCase();
        text = $(child).text().trim();
        if (tagName.indexOf("h") === 0){
            skript.push({
                action: "announcement",
                content: text
            });
        } else if (tagName === "p") {
            if(text.indexOf('[') === 0){
                text = text.split("\n").join(" ");
                text = text.slice(1, text.length - 1);
                if (text.toLowerCase().indexOf("enter") !== -1){
                    skript.push({
                        action: "announcement",
                        content: text
                    });
                    var enteringActors = findActorsInLine(text);
                    addToStaged(enteringActors);
                    skript.push({
                        action: "enter",
                        actors: enteringActors
                    });
                } else if (/^Exit/.test(text) || /^Exeunt/.test(text)){
                    skript.push({
                        action: "announcement",
                        content: text
                    });
                    if (/^Exeunt/.test(text)){
                        skript.push({
                            action: "exit",
                            actors: stagedActors.slice()
                        });
                        stagedActors = [];
                    } else {
                        var exitingActors = findActorsInLine(text);
                        if (exitingActors.length === 0){
                            exitingActors = [actorBefore];
                        }
                        skript.push({
                            action: "exit",
                            actors: exitingActors
                        });
                        removeFromStaged(exitingActors);
                    }
                } else {
                    skript.push({
                        action: "announcement",
                        content: text
                    });
                }
            } else {
                textParts = text.split("\n");
                var nameParts = textParts[0].trim();
                nameParts = nameParts.split(" ");
                var name = nameParts[0].slice(0, -1);
                var actor = findActor(name), textPart;
                if (actor !== undefined){
                    actorBefore = actor;
                } else {
                    actor = actorBefore;
                }
                for (var j = 1; j < textParts.length; j += 1){
                    textPart = textParts[j].trim();
                    textPart = textPart.replace(/—/g, " — ");
                    if (textPart.length === 0){
                        continue;
                    }
                    if(textPart.indexOf('[') === 0 && textPart.indexOf(']') === textPart.length -1){
                        textPart = textPart.slice(1, textPart.length - 1);
                        skript.push({
                            action: "announcement",
                            content: textPart
                        });
                        continue;
                    }

                    skript.push({
                        action: "speak",
                        actor: actor,
                        line: textPart
                    });
                }
            }
        } else {
            console.err("What?", tagName);
        }
    }

    for (i = 0; i < skript.length; i += 1){
        skript[i].i = i;
    }

    var config = {
        setup: {
          author: "Shakespeare",
          irc: {
            server: "irc.mysociety.org",
            channel: "#nodespeare",
            prefix: "hamlet|"
          }
        },
        skript: skript
    };
    config.setup.actors = [];
    for (var ac in actors){
        config.setup.actors.push({id: ac, name: actors[ac]});
    }
    sys.puts(JSON.stringify(config, null, " "));
});

