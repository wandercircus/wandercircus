var path = require('path');

module.exports = {
    host: '0.0.0.0',
    port: process.env.NODE_ENV === 'production' ? 80 : 3000,
    skriptsPath: path.join(__dirname, 'skripts'),
    sessionSecret: 'wepr239uhcpq9238hzihdcvbldkfvbnao3ufhaerivblzdvbai38hifucblhvbzliuvbali3euwbil32u',
};

// if run as root, downgrade to the owner of this file
if (process.getuid() === 0) {
  require('fs').stat(__filename, function(err, stats) {
    if (err) return console.log(err)
    process.setuid(stats.uid);
  });
}
