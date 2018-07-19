'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
var bodyParser = require('body-parser');

var app = module.exports = loopback();

app.start = function() {
  // start the web server
  return app.listen(function() {
    // For now we use global config for this, but eventually we will be moving this configuration info to a separate config file
    // var exchangeConfig = require('./config-exchange');
    // app.set('exchange-config', exchangeConfig);
    // console.log(app.get('exchange-config'));

    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  app.middleware('parse', bodyParser.json({limit: '50mb'}));
  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
