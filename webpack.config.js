const { withExpo } = require('@expo/webpack-config');

module.exports = function (env, argv) {
  const config = withExpo(env, argv);

  // Add proper MIME type handling for JavaScript
  config.devServer = config.devServer || {};
  config.devServer.headers = config.devServer.headers || {};
  config.devServer.headers['Content-Type'] = 'application/javascript; charset=utf-8';

  // Add middleware to fix MIME type issues
  if (!config.devServer.setupMiddlewares) {
    config.devServer.setupMiddlewares = [];
  }

  // Ensure .bundle files are served as JavaScript
  config.module = config.module || {};
  config.module.rules = config.module.rules || [];
  
  config.module.rules.push({
    test: /\.bundle$/,
    type: 'javascript/auto',
  });

  return config;
};
