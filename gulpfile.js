// Node
var env = process.env.NODE_ENV || 'local';

// Gulp tools
var gulp = require('gulp');
var u = require('gulp-util');
var log = u.log;
var c = u.colors;
var plumber = require('gulp-plumber');
var merge = require('merge-stream');

// Project deps
var nodemon = require('gulp-nodemon');
var sass = require('gulp-sass');
var prefix = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var bs = require('browser-sync');
var reload = bs.reload;

// Deployment debugging
log(c.yellow('Detected environment: ' + env));


// -----------------------------------------------------------------------------
// Browser Sync
// -----------------------------------------------------------------------------
gulp.task('bs', function() {
  bs({
    server: './',
    files: 'css/*.css'
  });
});


// -----------------------------------------------------------------------------
// Sass Task
//
// Compiles Sass and runs the CSS through autoprefixer.
// -----------------------------------------------------------------------------
gulp.task('sass', function() {
  bs.notify('<span style="color: grey">Running:</span> Sass task');

  return gulp.src('sass/**/*.scss')
    .pipe(plumber())
    .pipe(sass({
        outputStyle: 'nested',
      })
      .on('error', function(err, res) {
        log(c.red('sass'), 'failed to compile');
        log(c.red('> ') + err.message);
        bs.notify('<span style="color: red">Sass failed to compile</span>');
      })
    )
    .pipe(prefix('last 2 versions', '> 1%'))
    .pipe(gulp.dest('css'))
    .pipe(reload({stream:true}));
});


// -----------------------------------------------------------------------------
// JS task
// -----------------------------------------------------------------------------
gulp.task('js', function() {
  bs.notify('<span style="color: grey">Running:</span> JS tasks');

  var bootstrap = gulp.src([
    'js/modernizr.min.js',
    'js/hammer.min.js',
    'js/utils.js',
    'js/socket.js',
    'js/login.js',
  ])
  .pipe(plumber())
  .pipe(concat('bootstrap.min.js'))
  .pipe(uglify())
  .pipe(gulp.dest('_public/js'));

  var ui = gulp.src([
    'node_modules/two.js/build/two.js',
    'js/client.js',
    'js/canvas.js',
    'js/controls.js',
  ])
  .pipe(plumber())
  .pipe(concat('ui.min.js'))
  .pipe(uglify())
  .pipe(gulp.dest('_public/js'))
  .pipe(reload({stream: true}));

  return merge(bootstrap, ui);
});


// -----------------------------------------------------------------------------
// Prep images
// -----------------------------------------------------------------------------
gulp.task('img', function() {
  return gulp.src('img/*')
    .pipe(gulp.dest('_public/img'));
});


// -----------------------------------------------------------------------------
// Build all the assets
// -----------------------------------------------------------------------------
gulp.task('build', ['sass', 'js', 'img']);


// -----------------------------------------------------------------------------
// Watch tasks
// -----------------------------------------------------------------------------
gulp.task('watch', function() {
  gulp.watch('sass/**/*', ['sass']);
  gulp.watch('js/*', ['js']);
});


// -----------------------------------------------------------------------------
// Run the dev server
// -----------------------------------------------------------------------------
gulp.task('start', ['sass', 'js', 'img', 'watch', 'bs'], function () {
  nodemon({
    script: 'index.js',
    ext: 'html dust js',
    env: { 'NODE_ENV': env }
  });
});


// -----------------------------------------------------------------------------
// Default should just start the server
// -----------------------------------------------------------------------------
gulp.task('default', ['start']);
