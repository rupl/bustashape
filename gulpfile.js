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
var sass = require('gulp-sass')(require('sass'));
var prefix = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var bs = require('browser-sync');
var reload = bs.reload;

// Deployment debugging
log(c.yellow('Detected environment:'), c.bgYellow.black(' ' + env + ' '));


//——————————————————————————————————————————————————————————————————————————————
// Browser Sync
//——————————————————————————————————————————————————————————————————————————————
function bsTask() {
  bs({
    proxy: 'localhost:' + port,
    files: 'css/*.css',
    open: false,
    ghostMode: false // ghostMode is incompatible with bustashape's socket data.
  });
};
bsTask.description = 'Runs browser-sync and listens for changes to CSS';
module.exports.bs = bsTask;


//——————————————————————————————————————————————————————————————————————————————
// Sass Task
//
// Compiles Sass and runs the CSS through autoprefixer.
//——————————————————————————————————————————————————————————————————————————————
function sassTask() {
  bs.notify('<span style="color: grey">Running:</span> Sass task');

  return gulp.src('sass/**/*.scss')
    .pipe(plumber())
    .pipe(sass()
      .on('error', function(err, res) {
        log(c.red('sass'), 'failed to compile');
        log(c.red('> ') + err.message);
        bs.notify('<span style="color: red">Sass failed to compile</span>');
      })
    )
    .pipe(prefix('last 2 versions', '> 1%'))
    .pipe(gulp.dest('_public/css'))
    .pipe(reload({stream:true}));
};
sassTask.description = 'Compiles sass';
module.exports.sass = sassTask;


//——————————————————————————————————————————————————————————————————————————————
// JS task
//——————————————————————————————————————————————————————————————————————————————
function jsTask() {
  bs.notify('<span style="color: grey">Running:</span> JS tasks');

  var bootstrap = gulp.src([
    'js/modernizr.min.js',
    'js/hammer.min.js',
    'js/utils.js',
    'js/socket.js',
  ])
  .pipe(plumber())
  .pipe(concat('bootstrap.min.js'))
  .pipe(uglify())
  .pipe(gulp.dest('_public/js'));

  var ui = gulp.src([
    'node_modules/two.js/build/two.js',
    'js/tween-old.js',
    'js/zui.js',
    'js/client.js',
    'js/login.js',
    'js/canvas.js',
    'js/controls.js',
    'js/shapes.js',
  ])
  .pipe(plumber())
  .pipe(concat('ui.min.js'))
  .pipe(uglify())
  .pipe(gulp.dest('_public/js'))
  .pipe(reload({stream: true}));

  return merge(bootstrap, ui);
};
jsTask.description = 'Bundles and minifies JS';
module.exports.js = jsTask;


//——————————————————————————————————————————————————————————————————————————————
// Prep images
//——————————————————————————————————————————————————————————————————————————————
function imgTask() {
  return gulp.src('img/*')
    .pipe(gulp.dest('_public/img'));
};
imgTask.description = 'Copies images to public directory.';
module.exports.img = imgTask;


//——————————————————————————————————————————————————————————————————————————————
// Build all the assets
//——————————————————————————————————————————————————————————————————————————————
gulp.task('build', gulp.series(sassTask, jsTask, imgTask));


//——————————————————————————————————————————————————————————————————————————————
// Watch tasks
//——————————————————————————————————————————————————————————————————————————————
gulp.task('watch', () => {
  gulp.watch('sass/**/*', gulp.series(sassTask));
  gulp.watch('js/**/*', gulp.series(jsTask));
});


//——————————————————————————————————————————————————————————————————————————————
// Run the dev server
//——————————————————————————————————————————————————————————————————————————————
gulp.task('start', gulp.parallel(sassTask, jsTask, imgTask, 'watch', bsTask, () => {
  nodemon({
    script: 'index.js',
    ext: 'html dust js json',
    env: { 'NODE_ENV': env }
  });
}));

//——————————————————————————————————————————————————————————————————————————————
// Default should just start the server
//——————————————————————————————————————————————————————————————————————————————
gulp.task('default', gulp.series('start'));
