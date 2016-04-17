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

  return gulp.src('_sass/**/*.scss')
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

  return gulp.src([
    '_js/modernizr.modernizr.min.js',
    '_js/utils.js',
    '_js/main.js',
  ])
  .pipe(plumber())
  .pipe(concat('main.min.js'))
  .pipe(uglify())
  .pipe(gulp.dest('js'))
  .pipe(reload({stream: true}));
});


// -----------------------------------------------------------------------------
// Build all the assets
// -----------------------------------------------------------------------------
gulp.task('build', ['sass', 'js', 'img']);


// -----------------------------------------------------------------------------
// Watch tasks
// -----------------------------------------------------------------------------
gulp.task('watch', function() {
  gulp.watch('_sass/**/*', ['sass']);
  gulp.watch('_js/*', ['js']);
});


// -----------------------------------------------------------------------------
// Run the dev server
// -----------------------------------------------------------------------------
gulp.task('start', ['sass', 'js', 'watch', 'bs']);


// -----------------------------------------------------------------------------
// Default should just start the server
// -----------------------------------------------------------------------------
gulp.task('default', ['start']);
