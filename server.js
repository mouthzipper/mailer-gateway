'use strict';

var Hapi = require('hapi');
var rabbit = require('wascally');
var routes = require('./routes');
var fetchConfig = require('zero-config');

var config = fetchConfig(__dirname);

// Get configurations
var apiConfig = config.get('api');
var rabbitConfig = config.get('rabbitmq');

// Add plugins here
var plugins = [
  {
    register: require('hapi-swagger'),
    options: {
      apiVersion: 'v1',
      payloadType: 'form'
    }
  }
];

var pluginOpts = {};

function startServer() {
  // Hapi server instance
  var server = new Hapi.Server();

  // Configure server connection
  server.connection(apiConfig);

  // Register plugins before starting the server
  server.register(plugins, pluginOpts, function (err) {
    if (err) {
      throw err;
    } else {
      // Add all the routes within the routes folder
      for (var route in routes) {
        server.route(routes[route]);
      }

      // Start the server
      server.start(function() {
        console.log('Server running at:', server.info.uri);
      });
    }
  });
}

function reportError() {
  rabbit.closeAll().then(function () {
    if (err) {
      throw err;
    }
  });
}

rabbit
  .configure({
    connection: rabbitConfig
  })
  .then(startServer)
  .then(undefined, reportError);

