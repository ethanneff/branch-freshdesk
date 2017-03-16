// lib
var gulp = require('gulp')
var standard = require('gulp-standard')

// commands
gulp.task('lint', lint)

// methods
function lint () {
  return gulp.src([
    './src/**/*.js',
    './gulpfile.js'
  ])
  .pipe(standard())
  .pipe(standard.reporter('default', {
    breakOnError: true,
    quiet: true
  }))
}
