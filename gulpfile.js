// Gulp tools
var gulp = require('gulp');
var u = require('gulp-util');
var log = u.log;
var c = u.colors;

// Project deps
var sass = require('gulp-sass');
var prefix = require('gulp-autoprefixer');
var bs = require('browser-sync');
var reload = bs.reload;

// -----------------------------------------------------------------------------
// Browser Sync
// -----------------------------------------------------------------------------
gulp.task('browser-sync', function() {
  bs({
    server: './'
  });
});

// -----------------------------------------------------------------------------
// Sass Task
//
// Compiles Sass and runs the CSS through autoprefixer. A separate task will
// combine the compiled CSS with vendor files and minify the aggregate.
// -----------------------------------------------------------------------------
gulp.task('sass', function() {
  bs.notify('<span style="color: grey">Running:</span> Sass task');
  return gulp.src('sass/**/*')
    .pipe(sass({
        outputStyle: 'nested',
      })
      .on('error', function(err, res) {
        gutil.log(c.red('sass'), 'failed to compile');
        gutil.log(c.red('> ') + err.message);
        bs.notify('<span style="color: red">Sass failed to compile</span>');
      })
    )
    .pipe(prefix('last 2 versions', '> 1%'))
    .pipe(gulp.dest('css'))
    .pipe(reload({stream:true}));
});

gulp.task('watch', function() {
  gulp.watch('sass/**/*', ['sass']);
});

// Default should just open the site
gulp.task('default', ['browser-sync', 'watch']);
