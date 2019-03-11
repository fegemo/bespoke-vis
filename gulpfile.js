const { src, dest, series, parallel, watch } = require('gulp'),
  map = require('vinyl-map'),
  terser = require('gulp-terser'),
  header = require('gulp-header'),
  rename = require('gulp-rename'),
  eslint = require('gulp-eslint'),
  merge = require('merge-stream'),
  buffer = require('vinyl-buffer'),
  webserver = require('gulp-webserver'),
  coveralls = require('gulp-coveralls'),
  source = require('vinyl-source-stream');

const del = require('delete'),
  ghpages = require('gh-pages'),
  browserify = require('browserify');

const istanbul = require('istanbul'),
  karma = require('karma');

const path = require('path');
const pkg = require('./package.json');

function clean() {
  return del([
    'dist',
    'demo/demo.bundled.js',
    'lib-instrumented',
    'test/coverage'
  ]);
}

function lint() {
  return src(['gulpfile.js', 'lib/**/*.js', 'specs/**/*.js']).pipe(
    eslint.failAfterError()
  );
}

function instrument() {
  return src('lib/**/*.js')
    .pipe(
      map((code, filename) => {
        const instrumenter = new istanbul.Instrumenter(),
          relativePath = path.relative(__dirname, filename);

        return instrumenter.instrumentSync(code.toString(), relativePath);
      })
    )
    .pipe(dest('lib-instrumented'));
}

function test(done) {
  const server = new karma.Server(
    {
      configFile: __dirname + '/karma.conf.js'
    },
    () => done()
  );

  server.start();
}

function coverageReport() {
  return src(['test/coverage/**/lcov.info']).pipe(coverageReport());
}

function compileDemo() {
  return browserify({ debug: false })
    .add(path.join('demo', 'demo.js'))
    .bundle()
    .pipe(source('demo.bundled.js'))
    .pipe(dest('demo'));
}

function encodeAssetsInDataURI(relativeUrl) {
  const DataUri = require('datauri');

  return new DataUri(
    path.resolve(__dirname, 'node_modules/vis/dist/', relativeUrl)
  ).content;
}

function compile() {
  return browserify({ debug: false, standalone: 'bespoke.plugins.math' })
    .add('./lib/bespoke-vis.js')
    .transform('browserify-css', {
      global: true,
      minify: true,
      autoInject: true,
      rootDir: './node_modules/vis/dist',
      processRelativeUrl: encodeAssetsInDataURI
    })
    .bundle()
    .pipe(source('bespoke-vis.js'))
    .pipe(buffer())
    .pipe(
      header(
        [
          '/*!',
          ' * <%= name %> v<%= version %>',
          ' *',
          ' * Copyright <%= new Date().getFullYear() %>, <%= author.name %>',
          ' * This content is released under the <%= license %> license',
          ' * ',
          ' */\n\n'
        ].join('\n'),
        pkg
      )
    )
    .pipe(dest('dist'))
    .pipe(rename('bespoke-vis.min.js'))
    .pipe(terser())
    .pipe(
      header(
        [
          '/*! <%= name %> v<%= version %> ',
          '© <%= new Date().getFullYear() %> <%= author.name %>, ',
          '<%= license %> License */\n'
        ].join(''),
        pkg
      )
    )
    .pipe(dest('dist'));
}

function dev() {
  const port = 8085;

  watch('lib/**/*.js', series(test, lint, compile));
  watch('test/spec/**/*.js', test);

  src('demo').pipe(
    webserver({
      livereload: true,
      open: true,
      port
    })
  );
}

function deploy(cb) {
  ghpages.publish(path.join(__dirname, 'demo'), cb);
}

exports.clean = clean;
exports.lint = lint;
exports.compile = series(lint, compile);
exports.test = series(lint, instrument, test);
exports.dev = series(compileDemo, dev);
exports.coveralls = series(exports.test, coverageReport);
exports.deploy = deploy;
