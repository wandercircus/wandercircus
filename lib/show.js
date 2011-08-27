module.exports = {
  status: "stopped",
  theater: null,
  skript: null,
  url: null,

  update: function(status, theater, skript, url) {
    if (["stopped", "running"].indexOf(status) == -1) {
      throw "Invalid Status";
    };

    this.status = status;
    this.theater = theater;
    this.skript = skript;
    this.url = url;
  }
}

