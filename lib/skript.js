var fs = require('fs'),
    path = require('path'),
    yaml = require('yamlparser');

function Skript(filePath) {
    var skriptStr = fs.readFileSync(filePath).toString(), skript;
    if (filePath.indexOf('.json') !== -1) {
        skript = JSON.parse(skriptStr);
    } else {
        skript = yaml.eval(skriptStr);
    }
    skript.id = path.basename(filePath).replace(/\./, '_');
    skript.votes = 0;
    skript.defaultChannel     = skript.setup && skript.setup.irc.channel || "#wandercircus";
    skript.nextShowChannel    = null;
    var addNickName = function (actor) {
        actor.nickName = skript.setup.irc.prefix + actor.id;
    };
    skript.setup.actors.forEach(addNickName);
    skript.skript.forEach(function(entry) {
        if (entry.actors)
            entry.actors.forEach(addNickName);
        else if (entry.actor)
            addNickName(entry.actor);
    });
    return skript;
}

exports.loadAllSkripts = function(skriptsPath) {
    var skripts = {};
    fs.readdirSync(skriptsPath).forEach(function(skriptFile) {
        var skriptPath = path.join(skriptsPath, skriptFile);
        var skript;
        try {
            skript = Skript(skriptPath);
        } catch (err) {
            return;
        }
        skripts[skript.id] = skript;
        console.log(skript.id, 'loaded');
    });
    return skripts;
};

