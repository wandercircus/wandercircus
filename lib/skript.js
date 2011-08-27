var fs = require('fs'),
    path = require('path'),
    yaml = require('yamlparser');

function Skript(path) {
    this.load(path);
}

Skript.prototype = {};

Skript.prototype.load = function(path) {
    var skriptStr = fs.readFileSync(path).toString();
    var skript = yaml.eval(skriptStr);
    this.skript = skript;
};

exports.loadAllSkripts = function(skriptsPath) {
    var skripts = [];
    fs.readdirSync(skriptsPath).forEach(function(skriptFile) {
        skriptPath = path.join(skriptsPath, skriptFile);
        skripts.push(new Skript(skriptPath));
    });
    return skripts;
};