var utils = require('./utils');

module.exports = {
  status: "stopped",
  theater: null,
  skript: null,

  update: function(status, theater, skript) {
    if (["stopped", "running"].indexOf(status) == -1) {
      throw "Invalid Status";
    }

    this.status = status;
    this.theater = theater;
    this.skript = skript;
  },

  startShow: function(theater, skript, callback, doneCallback) {
    var channel = skript.nextShowChannel ? skript.nextShowChannel : skript.defaultChannel;
    theater.setup(skript.setup, channel, function(){
        theater.run(skript.skript);
        this.update("running", theater, skript, "http://example.com");
        if (typeof callback === 'function') {
          callback(this);
        }
    }.bind(this), function() {
        this.update("stopped");
        if (doneCallback) doneCallback();
    }.bind(this));
  },

  export: function() {
    return {
      status: this.status,
      //theater: this.theater,
      skript: utils.massageSkript(this.skript),
    };
  }
}

