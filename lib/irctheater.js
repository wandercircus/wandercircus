var irc = require('irc'),
    _ = require('underscore');

var IRCActor = function(actorConfig, globalConfig){
    return {
        id: actorConfig.id,
        onStage: false,
        setup: function(clb){
            console.log(new Date().toString(), 'actor::setup', actorConfig.nickName);
            this.client = new irc.Client(globalConfig.irc.server, actorConfig.nickName, {
                userName: actorConfig.id,
                realName: actorConfig.name,
                port: 6667,
                debug: false,
                showErrors: false,
                autoRejoin: true,
                autoConnect: true,
                secure: false
            });
            this.client.addListener('connect', clb);
        },
        enter: function(clb) {
            console.log(new Date().toString(), "actor::enter", actorConfig.id, globalConfig.irc.channel);
            var that = this;
            if (this.onStage) {
                clb();
            } else {
                console.log(new Date().toString(), 'irc::join', actorConfig.id, globalConfig.irc.channel);
                try {
                    this.client.join(globalConfig.irc.channel, function(){
                        that.onStage = true;
                        clb();
                    });
                } catch(err){
                    // probablySocket not writable
                    // FIXME
                }
            }
        },
        perform: function(statement, clb){
            this.speak({line: "\001ACTION " + statement.what + "\001"}, clb);
        },
        speak: function(statement, clb) {
            console.log(new Date().toString(), "actor::speak", actorConfig.id);
            var that = this;
            if (!this.onStage){
                this.enter(function(){
                    that.speak(statement, clb);
                });
            }
            console.log(new Date().toString(), "irc::say", actorConfig.id, globalConfig.irc.channel, statement.line);
            try{
                this.client.say(globalConfig.irc.channel, statement.line);
            } catch(err){
                // Catch Socket not writable
                // FIXME
            }
            var timeout = statement.line.split(' ').length * 600 + 1000;
            setTimeout(clb, timeout);
        },
        exit: function(clb){
            console.log(new Date().toString(), 'actor::exit', actorConfig.id);
            var that = this;
            if (!this.onStage) {
                clb();
            } else {
                console.log(new Date().toString(), 'irc::part', globalConfig.irc.channel);
                this.client.part(globalConfig.irc.channel, function() {
                    that.onStage = false;
                    clb();
                });
            }
        },
        tearDown: function(clb){
            try{
                this.client.disconnect("");
            }catch(err){
            }
        }
    };
};

exports.getTheater = function(){
    return {
        running: false,
        setup: function(config, clb, doneClb){
            console.log(new Date().toString(), 'theater::setup');
            var that = this;
            this.actors = {};
            this.config = config;
            this.doneClb = doneClb;
            this.director =  new irc.Client(config.irc.server, config.irc.prefix + "director", {
                userName: 'nodeshakespearebot',
                realName: 'Director',
                port: 6667,
                debug: false,
                showErrors: false,
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
            this.running = true;
            console.log(new Date().toString(), 'theater::run');
            var current = 0, that = this, lastActor;
            that.director.addListener("message" + this.config.irc.channel, function(from, message){
                console.log(new Date().toString(), 'director got:', message, 'from:', from);
                if(message === "stop show"){
                    console.log(new Date().toString(), 'director stopped show');
                    that.stop();
                }
            });
            // should be called executeAndNextAndNextAndNext..
            var executeNext = function() {
                console.log(new Date().toString(), 'theater::run::executeNext', current);
                if (!that.running){
                    return;
                }
                if (!_.isUndefined(skript[current])) {
                    that.execute(skript[current], function() {
                        current += 1;
                        executeNext();
                    });
                } else {
                    that.tearDown();
                }
            };
            executeNext();
        },
        stop: function(){
            this.tearDown();
            this.director.part(this.config.irc.channel);
            this.director.disconnect("");
            this.running = false;
            if (this.doneClb){
                this.doneClb(this.config.name);
                this.doneClb = null;
            }
        },
        execute: function(statement, clb) {
            console.log(new Date().toString(), 'theater::execute', statement);
            if (_.isFunction(this[statement.action])) {
                this[statement.action](statement, clb);
            }
        },
        defaultPauseDuration: 2000,
        announcement: function(data, clb){
            this.director.say(this.config.irc.channel, data.content);
            setTimeout(clb, this.defaultPauseDuration);
        },
        pause: function(data, clb) {
            setTimeout(clb, data.duration || this.defaultPauseDuration);
        },
        forActorsDo: function(actorsIds, action, clb) {
            var that = this,
                cb = _.after(actorsIds.length, clb);
            actorsIds.forEach(function(id) {
                that.actors[id][action](cb);
            });
        },
        enter: function(data, clb) {
            this.forActorsDo(data.actors, "enter", clb);
        },
        speak: function(data, clb) {
            this.actors[data.actor].speak(data, clb);
        },
        perform: function(data, clb) {
            this.actors[data.actor].perform(data, clb);
        },

        exit: function(data, clb) {
            this.forActorsDo(data.actors, "exit", clb);
        },
        tearDown: function() {
            console.log(new Date().toString(), 'theater::teardown');
            _(this.actors).chain()
                .values()
                .filter(function(actor) { return actor.onStage; })
                .each(function(actor) { 
                    actor.exit(function(){});
                    actor.tearDown();
                });
        }
    };
};
