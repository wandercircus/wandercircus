var irc = require('irc');

var IRCActor = function(actorConfig, globalConfig){
    return {
        name: actorConfig.name,
        id: actorConfig.id,
        onStage: false,
        ready: false,
        setup: function(clb){
            console.log(globalConfig.irc.channel);
            this.client = new irc.Client(globalConfig.irc.server, actorConfig.nickName, {
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
        speak: function(statement, clb){
            var that = this;
            if (!this.onStage){
                this.enter(function(){
                    that.speak(statement, clb);
                });
            }
            console.log("say", this.id, globalConfig.irc.channel, statement.line);
            this.client.say(globalConfig.irc.channel, statement.line);
            var timeout = statement.line.length * 50;
            clb(timeout);
        },
        exit: function(clb){
            if (!this.onStage) {
                clb();
                return;
            }
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
            this.config = config;
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
            this.director.addListener('connect', function (){
                that.director.join(that.config.irc.channel, function(){
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
            });
        },
        run: function(skript){
            var current = 0, that = this, lastActor;
            that.director.addListener("message" + this.config.irc.channel,
                    function(from, message){
            });
            var next = function(timeout){
                current += 1;
                if (skript[current] === undefined){
                    that.tearDown();
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
        announcement: function(data, clb){
            this.director.say(this.config.irc.channel, data.content);
            setTimeout(function(){
                clb();
            }, 2000);
        },
        forActorsDo: function(actors, action, clb){
            var enteringActors = actors.length;
            for (var i = 0; i < enteringActors; i += 1){
                this.actors[actors[i]][action](function(){
                    enteringActors -= 1;
                    if (enteringActors === 0){
                        clb();
                    }
                });
            }
        },
        enter: function(data, clb){
            this.forActorsDo(data.actors, "enter", clb);
        },
        speak: function(data, clb){
            console.log(data);
            this.actors[data.actor].speak(data, clb);
        },
        exit: function(data, clb){
            this.forActorsDo(data.actors, "exit", clb);
        },
        tearDown: function(clb){
            for(var actor in this.actors){
                if(this.actors.hasOwnProperty(actor)){
                    this.actors[actor].exit(function(){});
                }
            }
        }
    };
};
