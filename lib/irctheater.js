var irc = require('irc');

var IRCActor = function(actorConfig, globalConfig){
    return {
        name: actorConfig.name,
        id: actorConfig.id,
        onStage: false,
        ready: false,
        setup: function(clb){
            console.log(globalConfig.irc.channel);
            this.client = new irc.Client(globalConfig.irc.server, actorConfig.id, {
                userName: actorConfig.id,
                realName: actorConfig.name,
                port: 6667,
                debug: true,
                showErrors: true,
                autoRejoin: true,
                autoConnect: true,
                channels: [globalConfig.irc.channel],
                secure: false
            });
            var that = this;
            this.client.addListener('connect', function () {
                that.ready = true;
                clb();
            });
        },
        enter: function(clb){
            console.log("enter", this.id, globalConfig.irc.channel);
            var that = this;
            this.client.join(globalConfig.irc.channel, function(){
                that.onStage = true;
                clb();
            });
        },
        speak: function(script, index, clb){
            var that = this;
            if (!this.onStage){
                this.enter(function(){
                    that.speak(line, clb);
                });
            }
            this.client.once("message"+globalConfig.irc.channel, function(from, message){
                console.log(from, message);
                console.log("say", this.id, globalConfig.irc.channel, line.line);
                this.client.say(globalConfig.irc.channel, line.line);
                clb(2000);
            });
        },
        exit: function(clb){
            this.client.part(globalConfig.irc.channel, function(){
                clb();
            });
            this.onStage = false;
        }
    };
};

exports.getTheater = function(){
    return {
        setup: function(config, clb){
            var that = this;
            this.actors = {};
            this.director =  new irc.Client(config.irc.server, "director__", {
                userName: 'nodeshakespearebot',
                realName: 'Director',
                port: 6667,
                debug: true,
                showErrors: true,
                autoRejoin: true,
                autoConnect: true,
                channels: [config.irc.channel],
                secure: false
            });
            this.director.addListener('connect', function () {
                var actorsConnecting = config.actors.length;
                for (var i = 0; i < config.actors.length; i += 1){
                    that.actors[config.actors[i].id] = IRCActor(config.actors[i], config);
                    that.actors[config.actors[i].id].setup(function(){
                        actorsConnecting--;
                        if (actorsConnecting === 0){
                            clb();
                        }
                    });
                }
            });
        },
        run: function(skript){
            var current = 0, that = this;
            var next = function(timeout){
                current += 1;
                if (skript[current] === undefined){
                    this.tearDown();
                    return;
                }
                setTimeout(function(){
                    that.execute(skript[current], next);
                }, timeout);
            };
            if (skript[current] !== undefined){
                this.execute(skript[current], next);
            }
        },
        execute: function(statement, next){
            this.on(statement.action, statement, next);
        },
        on: function(event, data, next){
            if (this[event] === undefined){
                return;
            }
            this[event](data, function(val){
                next(val ? val : 0);
            });
        },
        enter: function(data, clb){
            var enteringActors = data.actors.length;
            for (var i = 0; i < enteringActors; i += 1){
                console.log(data.actors[i]);
                this.actors[data.actors[i]].enter(function(){
                    enteringActors -= 1;
                    if (enteringActors === 0){
                        clb();
                    }
                });
            }
        },
        line: function(data, clb){
            this.actors[data.actor].speak(data, clb);
        },
        tearDown: function(){
            for(var actor in this.actors){
                if(this.actors.hasOwnProperty(actor)){
                    this.actors[actor].exit();
                }
            }
        }
    };
};
