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
                votePercentage : skript.votePercentage
            }
        })
    },

    stripSkripts: function(skripts) {
        return _.map(skripts, function(skript) {
            var newSkript = _.clone(skript);
            delete newSkript.skript;
            return newSkript;
        })
    }
}
