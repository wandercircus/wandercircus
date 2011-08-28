var _ = require('underscore');

module.exports = {
    calculateVotePercentage: function(skripts) {
        var allVotes = _.reduce(
            skripts,
            function(memo, skript) { return memo + skript.votes },
            0);

        _.each(skripts, function(skript, id) {
            skript.votePercentage = (skript.votes / allVotes);
            skripts[id] = skript;
        })
    },

    stripForVotes: function(skripts) {
        return _.map(skripts, function(skript) {
            return {
                id             : skript.id,
                votes          : skript.votes,
                votePercentage : skript.votePercentage,
                channel        : skript.nextShowChannel ? skript.nextShowChannel : skript.defaultChannel
            }
        })
    },

    massageSkripts: function(skripts) {
        return _.map(skripts, function(skript) {
            return this.massageSkript(skript);
        }.bind(this))
    },

    massageSkript: function(skript) {
        var newSkript = _.clone(skript);
        delete newSkript.skript;
        newSkript.channel = newSkript.nextShowChannel ? newSkript.nextShowChannel : newSkript.defaultChannel;
        return newSkript;
    }
}
