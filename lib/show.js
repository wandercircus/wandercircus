module.exports = {
  status: "stopped",
  theater: null,
  skript: null,
  url: null,

  update: function(status, theater, skript, url) {
    if (["stopped", "running"].indexOf(status) == -1) {
      throw "Invalid Status";
    }

    this.status = status;
    this.theater = theater;
    this.skript = skript;
    this.url = url;
  },

  startShow: function(theater, skript) {
    theater.setup(skript.setup, function(){
        theater.run(skript.skript);
        this.update("running", theater, skript, "http://example.com");
    }.bind(this));
  }
}

