// include the required packages.
var gulp = require('gulp')
var standard = require('gulp-standard')

gulp.task('lint', function () {
  return gulp.src(['./src/**/*.js'])
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: true,
      quiet: true
    }))
})