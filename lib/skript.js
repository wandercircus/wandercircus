var fs = require('fs'),
    path = require('path'),
    yaml = require('yamlparser'),
    _ = require('underscore');

function Skript(filePath) {
    var skriptStr = fs.readFileSync(filePath).toString();
    var skript = yaml.eval(skriptStr);
    skript.id = path.basename(filePath);
    var addNickName = function (actor) {
        actor.nickName = skript.setup.prefix + actor.id;
    }
    _(skript.setup.actors).each(addNickName);
    _(skript.skript).each(function(entry) {
        if (entry.actors)
            _(entry.actors).each(addNickName);
        else if (entry.actor)
            addNickName(entry.actor);
    });
    return skript;
}

exports.loadAllSkripts = function(skriptsPath) {
    var skripts = [];
    fs.readdirSync(skriptsPath).forEach(function(skriptFile) {
        skriptPath = path.join(skriptsPath, skriptFile);
        skripts.push(Skript(skriptPath));
    });
    return skripts;
};

