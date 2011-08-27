var fs = require('fs'),
    path = require('path'),
    yaml = require('yamlparser');

function Skript(name) {
    this.load(name);
}

Skript.prototype = {};

Skript.prototype.generateSkriptPath = function(name) {
    var skriptsDir = path.join(path.dirname(module.filename), '..', 'skripts');
    return path.join(skriptsDir, name + '.yml');
};

Skript.prototype.load = function(name) {
    var skriptStr = fs.readFileSync(this.generateSkriptPath(name)).toString();
    var skript = yaml.eval(skriptStr);
    this.skript = skript;
};


exports['Skript'] = Skript;