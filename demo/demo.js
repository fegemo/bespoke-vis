const bespoke = require('bespoke'),
  theme = require('bespoke-theme-fancy'),
  keys = require('bespoke-keys'),
  vis = require('../dist/bespoke-vis.min.js');

bespoke.from('article', [
  theme(),
  keys(),
  vis()
]);
