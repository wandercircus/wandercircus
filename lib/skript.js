var fs = require('fs'),
    path = require('path'),
    yaml = require('yamlparser');

function Skript(name) {
    var skriptsDir = path.join(path.dirname(module.filename), '..', 'skripts');
    var filePath = path.join(skriptsDir, name + '.yml');
    var skriptStr = fs.readFileSync(filePath).toString();
    var skript = yaml.eval(skriptStr);
    for (var i = 0; i < skript.setup.actors.length; i += 1) {
        skript.setup.actors[i].id = skript.setup.actors[i].id + "__node";
    }
    for (i = 0; i < skript.skript.length; i += 1) {
        var actors = skript.skript[i].actors || [skript.skript[i].actor];
        for (j = 0; j < actors.length; j += 1) {
            actors[j] = actors[j] + "__node";
        }
    }
    return skript;
}

exports['Skript'] = Skript;
exports.loadAllSkripts = function(skriptsPath) {
    var skripts = [];
    fs.readdirSync(skriptsPath).forEach(function(skriptFile) {
        skriptPath = path.join(skriptsPath, skriptFile);
        skripts.push(Skript(skriptPath));
    });
    return skripts;
};

