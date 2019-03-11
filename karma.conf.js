const puppeteer = require('puppeteer');

process.env.CHROME_BIN = puppeteer.executablePath();

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', 'browserify'],
    files: ['test/spec/*Spec.js'],
    exclude: [],

    preprocessors: {
      'test/**/*.js': 'browserify',
      'lib/**/*.js': 'coverage'
    },

    browserify: {
      debug: true,
      transform: [['browserify-css', { global: true, rootDir: './inexistent_directory' }]]
    },

    reporters: ['progress', 'coverage'],

    coverageReporter: {
      dir: 'test/coverage',
      reporters: [
        {
          type: 'lcov',
          subdir: 'lcov'
        },
        {
          type: 'html',
          subdir: 'html'
        }
      ]
    },

    port: 8080,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['ChromeHeadless'],
    singleRun: true
  });
};
