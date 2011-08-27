var irc = require('irc'),
    _ = require('underscore');

var IRCActor = function(actorConfig, globalConfig){
    return {
        onStage: false,
        setup: function(clb){
            console.log('setup', actorConfig.nickName);
            this.client = new irc.Client(globalConfig.irc.server, actorConfig.nickName, {
                userName: actorConfig.id,
                realName: actorConfig.name,
                port: 6667,
                debug: false,
                showErrors: false,
                autoRejoin: true,
                autoConnect: true,
                channels: [globalConfig.irc.channel],
                secure: false
            });
            this.client.addListener('connect', clb);
        },
        enter: function(clb) {
            console.log("actor::enter", this.id, globalConfig.irc.channel);
            var that = this;
            if (this.onStage) {
                clb();
            } else {
                this.client.join(globalConfig.irc.channel, function(){
                    that.onStage = true;
                    clb();
                });
            }
        },
        speak: function(statement, clb) {
            console.log("actor::speak", this.id);
            var that = this;
            if (!this.onStage){
                this.enter(function(){
                    that.speak(statement, clb);
                });
            }
            console.log("say", this.id, globalConfig.irc.channel, statement.line);
            this.client.say(globalConfig.irc.channel, statement.line);
            var timeout = statement.line.length * 50;
            setTimeout(clb, timeout);
        },
        exit: function(clb){
            console.log('actor::exit', this.id)
            var that = this;
            if (!this.onStage) {
                clb();
            } else {
                this.client.part(globalConfig.irc.channel, function(){
                    that.onStage = false;
                    clb();
                });
            }
        }
    };
};

exports.getTheater = function(){
    return {
        setup: function(config, clb){
            console.log('SETUP')
            var that = this;
            this.actors = {};
            this.config = config;
            this.director =  new irc.Client(config.irc.server, config.prefix + "director", {
                userName: 'nodeshakespearebot',
                realName: 'Director',
                port: 6667,
                debug: true,
                showErrors: true,
                autoRejoin: true,
                autoConnect: true,
                secure: false
            });
            this.director.addListener('connect', function() {
                that.director.join(that.config.irc.channel, function() {
                    var cb = _.after(config.actors.length, clb);
                    config.actors.forEach(function(actor) {
                        that.actors[actor.id] = IRCActor(actor, config);
                        that.actors[actor.id].setup(cb);
                    });
                });
            });
        },
        run: function(skript) {
            console.log('RUNNING')
            var current = 0, that = this, lastActor;
            that.director.addListener("message" + this.config.irc.channel, function(from, message){
                console.log('director got:', message, 'from:', from);
            });
            // should be called executeAndNextAndNextAndNext..
            var executeNext = function() {
                console.log('theater::run::executeNext', current);
                if (!_.isUndefined(skript[current])) {
                    that.execute(skript[current], function() {
                        current += 1;
                        executeNext()
                    });
                } else {
                    that.tearDown();
                    return;
                }
            };
            executeNext();
        },
        execute: function(statement, clb) {
            console.log('[EXECUTE]', statement)
            if (_.isFunction(this[statement.action])) {
                this[statement.action](statement, clb);
            }
        },
        announcement: function(data, clb){
            this.director.say(this.config.irc.channel, data.content);
            setTimeout(clb, 2000);
        },
        forActorsDo: function(actorsIds, action, clb) {
            var that = this,
                cb = _.after(actorsIds.length, clb);
            _(actorsIds).each(function(id) {
                that.actors[id][action](cb);
            });
        },
        enter: function(data, clb) {
            this.forActorsDo(data.actors, "enter", clb);
        },
        speak: function(data, clb) {
            this.actors[data.actor].speak(data, clb);
        },
        exit: function(data, clb) {
            this.forActorsDo(data.actors, "exit", clb);
        },
        tearDown: function() {
            console.log('[TEARDOWN]')
            // FIXME
            // this.exit({actors: _.keys(this.actors)});
        }
    };
};
