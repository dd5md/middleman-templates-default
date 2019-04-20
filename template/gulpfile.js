var gulp = require('gulp');
var livereload = require('gulp-livereload')
var sass = require('gulp-sass');
var uglify = require('gulp-uglifyjs');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var wait = require('gulp-wait');

gulp.task('imagemin', function () {
  return gulp.src('./source/assets/images/*')
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    }))
    .pipe(gulp.dest('./source/assets/images/'));
});

gulp.task('sass', function () {
  gulp.src('./source/assets/stylesheets/**/*.scss')
    .pipe(sourcemaps.init())
      .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
      .pipe(autoprefixer('last 4 version', 'safari 5', 'ie 7', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./source/assets/stylesheets/bundle'));
});

gulp.task('uglify', function () {
  gulp.src('./source/assets/javascripts/*.js')
    .pipe(uglify('all.min.js'))
    .pipe(gulp.dest('./source/assets/javascripts/bundle'));
});

gulp.task('watch', function(){
  livereload.listen();
  gulp.watch('./source/assets/stylesheets/**/*.scss', ['sass']);
  gulp.watch('./source/assets/javascripts/*.js', ['uglify']);
  gulp.watch(['./source/assets/stylesheets/bundle/site.css', './source/assets/javascripts/bundle/all.min.js'], function (files){
      livereload.changed(files)
  });
  gulp.watch(['./source/**/*.erb'], function (e){
    gulp.src(e.path)
    .pipe(wait(1000))
    .pipe(livereload({ reloadPage: 'http://192.168.1.22:5777/' }));
  });
});
