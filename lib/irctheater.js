var irc = require('irc');

var IRCActor = function(actorConfig, globalConfig){
    return {
        name: actorConfig.name,
        onStage: false,
        ready: false,
        setup: function(clb){
            this.client = new irc.Client(globalConfig.ircServer, actorConfig.name, {
                userName: 'nodeshakespearebot',
                realName: 'nodeJS IRC client',
                port: 6667,
                debug: true,
                showErrors: true,
                autoRejoin: true,
                autoConnect: true,
                channels: [globalConfig.ircChannel],
                secure: false
            });
            var that = this;
            this.client.addListener('connect', function () {
                that.ready = true;
                clb();
            });
        },
        enter: function(clb){
            console.log("enter", this.name, globalConfig.ircChannel);
            var that = this;
            this.client.join(globalConfig.ircChannel, function(){
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
            this.client.once("message"+globalConfig.ircChannel, function(from, message){
                console.log(from, message);
                console.log("say", this.name, globalConfig.ircChannel, line.line);
                this.client.say(globalConfig.ircChannel, line.line);
                clb(2000);
            });
        },
        exit: function(clb){
            this.client.part(globalConfig.ircChannel, function(){
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
            this.director =  new irc.Client(config.ircServer, config.name, {
                userName: 'nodeshakespearebot',
                realName: 'Director',
                port: 6667,
                debug: true,
                showErrors: true,
                autoRejoin: true,
                autoConnect: true,
                channels: [config.ircChannel],
                secure: false
            });
            this.director.addListener('connect', function () {
                var actorsConnecting = config.actors.length;
                for (var i = 0; i < config.actors.length; i += 1){
                    that.actors[config.actors[i].name] = IRCActor(config.actors[i], config);
                    that.actors[config.actors[i].name].setup(function(){
                        actorsConnecting--;
                        if (actorsConnecting === 0){
                            clb();
                        }
                    });
                }
            });
        },
        run: function(script){
            var current = 0, that = this;
            var next = function(timeout){
                current += 1;
                if (script[current] === undefined){
                    this.tearDown();
                    return;
                }
                console.log("Statement done");
                return;
                setTimeout(function(){
                    that.execute(script[current], next);
                }, timeout);
            };
            if (script[current] !== undefined){
                this.execute(script[current], next);
            }
        },
        execute: function(statement, next){
            this.on(statement.type, statement, next);
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
