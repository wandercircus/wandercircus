var fs = require('fs'),
    path = require('path'),
    yaml = require('yamlparser'),

function Skript(filePath) {
    var skriptStr = fs.readFileSync(filePath).toString(), skript;
    if (filePath.indexOf('.json') !== -1) {
        skript = JSON.parse(skriptStr);
    } else {
        skript = yaml.eval(skriptStr);
    }
    skript.id = path.basename(filePath);
    var addNickName = function (actor) {
        actor.nickName = skript.setup.prefix + actor.id;
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
        var skript = Skript(skriptPath);
        skripts[skript.id] = skript;
    });
    return skripts;
};

