// Node
var env = process.env.NODE_ENV || 'local';
var port = process.env.PORT || 5000;

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
var eslint = require('gulp-eslint');
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
    proxy: 'localhost:' + port,
    files: 'css/*.css',
    open: false,
    ghostMode: false, // incompatible with bustashape's socket data.
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
      .on('error', function(err) {
        log(c.red('sass'), 'failed to compile');
        log(c.red('> ') + err.message);
        bs.notify('<span style="color: red">Sass failed to compile</span>');
      })
    )
    .pipe(prefix('last 2 versions', '> 1%'))
    .pipe(gulp.dest('_public/css'))
    .pipe(reload({stream:true}));
});


// -----------------------------------------------------------------------------
// JS task
// -----------------------------------------------------------------------------
gulp.task('js', function() {
  bs.notify('<span style="color: grey">Running:</span> JS tasks');

  var vendor = gulp.src([
    'js/vendor/modernizr.min.js',
    'js/vendor/hammer.min.js',
    'node_modules/two.js/build/two.js',
    'js/vendor/tween-old.js',
    'js/vendor/zui.js',
  ])
  .pipe(plumber())
  .pipe(concat('vendor.min.js'))
  .pipe(uglify())
  .pipe(gulp.dest('_public/js'));

  var main = gulp.src([
    'js/_busta.js',
    'js/_utils.js',
    'js/socket.js',
    'js/client.js',
    'js/login.js',
    'js/canvas.js',
    'js/controls.js',
    'js/shapes.js',
  ])
  .pipe(plumber())
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(concat('main.min.js'))
  .pipe(uglify())
  .pipe(gulp.dest('_public/js'))
  .pipe(reload({stream: true}));

  return merge(vendor, main);
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
  gulp.watch('js/**/*', ['js']);
});


// -----------------------------------------------------------------------------
// Run the dev server
// -----------------------------------------------------------------------------
gulp.task('start', ['sass', 'js', 'img', 'watch', 'bs'], function () {
  return nodemon({
    script: 'index.js',
    ext: 'html dust js json',
    env: { 'NODE_ENV': env },
  });
});


// -----------------------------------------------------------------------------
// Default should just start the server
// -----------------------------------------------------------------------------
gulp.task('default', ['start']);
