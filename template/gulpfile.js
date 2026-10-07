'use strict';

const gulp             = require('gulp');
const del              = require('del');
const sass             = require('gulp-sass')(require('sass'));
const bourbon          = require('bourbon').includePaths;
const cssnano          = require('cssnano');
const gulpif           = require('gulp-if');
const sharp            = require('sharp');
const { Transform }    = require('stream');
const csso             = require('gulp-csso');
const rename           = require('gulp-rename');
const concat           = require('gulp-concat');
const terser           = require('terser');
const gulpTerser       = require('gulp-terser');
const replace          = require('gulp-replace');
const plumber          = require('gulp-plumber');
const postcss          = require('gulp-postcss');
const autoprefixer     = require('autoprefixer');
const touch            = require('gulp-touch-fd');
const cleanCSS         = require('gulp-clean-css');
const htmlclean        = require('gulp-htmlclean');
const inlinesource     = require('gulp-inline-source');
const inlineImages     = require('gulp-inline-images');
const stripComments    = require('gulp-strip-comments');
const stripCssComments = require('gulp-strip-css-comments');
const htmlmin          = require('gulp-html-minifier-terser');
const browsersync      = require('browser-sync').create();

// DIRS
const dirs = {
  src:    './source/',
  dest:   './build/',
  static: './source/statics/',
  assets: './source/assets/',
  erb:    './source/**/*.{html,erb}',
  html:   './build/**/*.html',
  node:   './node_modules/'
}

// PATHS
const paths = {
  static: {
    sass:     dirs.static + 'stylesheets/site.sass',
    img:      dirs.static + 'images/**/*.{svg,gif,ico}',
    webp:     dirs.static + 'images/**/*.{jpg,jpeg,png}',
    files:    dirs.static + 'files/*.pdf',
    fonts:    dirs.static + 'fonts/**/*.{woff,woff2,svg}',
    scripts:  dirs.static + 'javascripts/'
  },
  watch: {
    sass:     dirs.static + 'stylesheets/**/*.sass',
    sassf:    dirs.static + 'stylesheets/fonts/*.sass',
    js:       dirs.static + 'javascripts/**/*.js'
  },
  assets: {
    css:      dirs.assets + 'stylesheets/',
    styles:   dirs.assets + 'stylesheets/site.css',
    stylesf:  dirs.assets + 'stylesheets/fonts.css',
    js:       dirs.assets + 'javascripts/',
    img:      dirs.assets + 'images/',
    fonts:    dirs.assets + 'fonts/',
    files:    dirs.assets + 'files/'
  },
  build: {
    css:     dirs.dest   + 'assets/stylesheets/',
    js:      dirs.dest   + 'assets/javascripts/'
  },
  compress: {
    html:    dirs.dest   + '**/*.html',
    styles:  dirs.dest   + 'assets/stylesheets/site-*.css',
    scripts: dirs.dest   + 'assets/javascripts/site-*.js'
  },
  optimize: {
    css:     dirs.assets + 'stylesheets/site.css',
    cssf:    dirs.assets + 'stylesheets/fonts.css',
    script:  dirs.assets + 'javascripts/site.js'
  }
}

// BROWSERLIST
const browserslist = [
  'last 1 version',
  'last 3 safari versions',
  'last 3 ios versions'
]

// TERSER OPTIONS
const terserOptions = {
  mangle: false,
  safari10: false,
  compress: {
    inline: true,
    unused: true,
    unsafe: true,
    defaults: false
  }
}

// CSSNANO OPTIONS
const nanoOptions = {
  discardComments: { removeAll: true },
  keepSpecialComments: 0
}

// POSTCSS PLUGINS
const postcssPlugins = [
  autoprefixer({
    overrideBrowserslist: browserslist,
    cascade: false,
    inline: true,
    remove: true
  }),
  cssnano(nanoOptions)
]

// FEHLERMELDUNG
//
// Ersetzt gulp-notify. Das rief `terminal-notifier` auf, ein mitgeliefertes
// Fremdprogramm - und zwar eines fuer Intel-Prozessoren. Auf Apple Silicon
// scheitert der Aufruf mit "Unknown system error -86" (EBADARCH, falscher
// CPU-Typ) und ueberschwemmt die Ausgabe mit Meldungen ueber Meldungen, die
// nicht angezeigt werden konnten.
//
// Hier steht der Fehler schlicht im Terminal - dort, wo man ohnehin hinsieht.
// Das `this.emit('end')` am Schluss ist wichtig: Es sagt gulp, dass dieser
// Datenstrom sauber endet, statt den ganzen Lauf abzubrechen. Genau dafuer
// ist plumber da.
function meldeFehler(fehler) {
  const rot = '\x1b[31m', aus = '\x1b[0m';
  console.error(`\n${rot}✖ Fehler in ${fehler.plugin || 'gulp'}${aus}`);
  console.error(fehler.messageFormatted || fehler.message || fehler);
  this.emit('end');
}

// WEBP OHNE FREMDPROGRAMM
//
// Ersetzt gulp-webp. Das benutzte ueber mehrere Zwischenschichten das
// Kommandozeilenwerkzeug `cwebp` - ebenfalls als Intel-Programm mitgeliefert,
// ebenfalls mit Fehler -86 gescheitert. Deshalb kamen jahrelang keine
// WebP-Dateien mehr heraus, ohne dass der Build abgebrochen waere.
//
// `sharp` bringt libwebp selbst mit, laeuft nativ auf Apple Silicon und ist
// um ein Vielfaches schneller, weil kein Prozess je Bild gestartet wird.
// Die paar Zeilen darum sind ein gewoehnlicher Node-Datenstrom - kein
// gulp-Zusatzpaket, das in drei Jahren wieder bricht.
function zuWebp(einstellungen = {}) {
  return new Transform({
    objectMode: true,
    async transform(datei, _kodierung, fertig) {
      if (datei.isNull() || !datei.isBuffer()) return fertig(null, datei);
      try {
        datei.contents = await sharp(datei.contents).webp(einstellungen).toBuffer();
        datei.extname = '.webp';
        fertig(null, datei);
      } catch (fehler) {
        fehler.plugin = 'sharp/webp';
        fertig(fehler);
      }
    }
  });
}

// SASS OPTIONS
const sassOptions = {
  outputStyle: 'compressed',
  precision: 10,

  // Warnungen daempfen - es sind Warnungen, keine Fehler. Sass uebersetzt
  // alles einwandfrei; es kuendigt nur an, dass Schreibweisen wie `darken()`,
  // `@import` und die Division mit Schrastrich in einer kuenftigen Version
  // wegfallen.
  //
  // `quietDeps` schweigt ueber alles aus node_modules. Das ist der Loewenanteil:
  // Material Components ist von 2019, Bourbon von 2020 - an deren Code kann
  // man ohnehin nichts aendern. Allein daraus kamen ueber 1100 Zeilen je Lauf.
  quietDeps: true,

  // Und diese Ankuendigungen auch fuer die eigenen Dateien stummschalten.
  // Bewusst einzeln aufgezaehlt statt pauschal: So sieht man hier schwarz auf
  // weiss, was noch aufzuraeumen waere, wenn Sass 3.0 naeherrueckt.
  // Der sichere Riegel: ein eigener Melder, der schweigt.
  //
  // `quietDeps` und `silenceDeprecations` weiter unten werden von gulp-sass
  // ueber die aeltere dart-sass-Schnittstelle zwar durchgereicht, aber nicht
  // zuverlaessig beachtet. Ein eigener Logger dagegen wird immer gefragt -
  // und dieser hier sagt zu allem nichts.
  //
  // Achtung, das betrifft NUR Warnungen. Echte Fehler kommen weiterhin durch;
  // die laufen nicht ueber `warn`, sondern brechen die Uebersetzung ab.
  logger: {
    warn: function () {},
    debug: function () {},
  },

  silenceDeprecations: [
    'legacy-js-api',   // gulp-sass benutzt die aeltere Schnittstelle
    'import',          // @import -> spaeter @use / @forward
    'global-builtin',  // unquote() -> string.unquote() usw.
    'color-functions', // darken() -> color.adjust()
    'slash-div',       // $a / $b -> math.div($a, $b)
    'if-function',     // if(...) -> moderne CSS-Schreibweise
  ],

  // Die drei Punkte sind wichtig: require('bourbon').includePaths ist selbst
  // schon ein Array. Ohne sie entsteht eine verschachtelte Liste, die node-sass
  // stillschweigend glattgezogen hat - dart-sass dagegen findet dort keinen
  // Pfad und meldet "Can't find stylesheet to import" bei @import bourbon.
  includePaths: [...bourbon, './node_modules/']
}

// CRITICAL OPTIONS
// HTML OPTIONS
const htmlOptions = {
  minifyJS: true,
  minifyCSS: true,
  removeComments: true,
  collapseWhitespace: true,
  collapseBooleanAttributes: true,
  collapseInlineTagWhitespace: true,
  removeEmptyAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true
}

// JS SOURCE
const jsSource = [
  dirs.static + 'javascripts/mdc/mdc_drawer.js',
  dirs.static + 'javascripts/mdc/mdc_appbar.js',
  dirs.static + 'javascripts/mdc/mdc_list.js',
  dirs.static + 'javascripts/mdc/mdc_animation.js',
  dirs.static + 'javascripts/mdc/mdc_ripple.js',
  dirs.static + 'javascripts/mdc/mdc_line_ripple.js',
  dirs.static + 'javascripts/jquery.min.js',
  dirs.static + 'javascripts/jquery-migrate.min.js',
  dirs.static + 'javascripts/lazy.min.js',
  dirs.static + 'javascripts/glightbox.min.js',
  dirs.static + 'javascripts/letter.min.js',
  dirs.static + 'javascripts/typedjs.min.js'
]

// TOUCH CONFIG
function touchConfig(done) {
  gulp.src('config.rb').pipe(touch());
  done();
}

// BROWSERSYNC
function browserSync(done) {
  browsersync.init({
    open: false,
    notify: false,
    ghostMode: false,
    injectChanges: true,
    reloadOnRestart: true,
    proxy: '127.0.0.1:4567',
    files: [paths.watch.sass, paths.watch.js, dirs.erb],
    browser: ['safari18'],
    port: 7001,
    ui: {
      port: 7002
    }
  });
  done();
}

// BROWSERSYNC RELOAD
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// CLEANUP
function cleanUp() {
  return del([
    'source/assets/**'
  ]);
};

// COPYPDF
function copyPDF(done) {
  return gulp
    .src(paths.static.files)
    .pipe(plumber({
      errorHandler: meldeFehler
    }))
    .pipe(gulp.dest(paths.assets.files))
    .pipe(browsersync.stream());
  done();
}

// COPYFONTS
function copyFonts(done) {
  return gulp
    .src(paths.static.fonts)
    .pipe(plumber({
      errorHandler: meldeFehler
    }))
    .pipe(gulp.dest(paths.assets.fonts))
    .pipe(browsersync.stream());
  done();
}

// COPYIMAGES
function copyImages(done) {
  return gulp
    .src(paths.static.img)
    .pipe(plumber({
      errorHandler: meldeFehler
    }))
    .pipe(gulp.dest(paths.assets.img))
    .pipe(browsersync.stream());
  done();
}

// WEBP IMAGES
function webpImages(done) {
  return gulp
    .src(paths.static.webp)
    .pipe(plumber({
      errorHandler: meldeFehler
    }))
    .pipe(zuWebp({ quality: 60 }))
    .pipe(gulp.dest(paths.assets.img))
    .pipe(browsersync.stream());
  done();
}

// GULPCSS
function gulpCSS(done) {
  return gulp
    .src([
      paths.static.sass
    ])
    .pipe(plumber({
      errorHandler: meldeFehler
    }))
    .pipe(sass(sassOptions).on('error', sass.logError))
    .pipe(postcss(postcssPlugins))
    .pipe(stripCssComments())
    .pipe(gulp.dest(paths.assets.css))
    .pipe(browsersync.stream());
  done();
}

// COPYJS
function copyJS(done) {
  return gulp
    .src([
      dirs.node + 'glightbox/dist/js/glightbox.min.js',
      dirs.node + 'slick/slick/slick.min.js'
    ])
    .pipe(plumber({
      errorHandler: meldeFehler
    }))
    .pipe(gulp.dest(paths.static.scripts))
    .pipe(browsersync.stream());
  done();
}

// GULPJS
function gulpJS(done) {
  return gulp
    .src(jsSource)
    .pipe(plumber({
      errorHandler: meldeFehler
    }))
    .pipe(concat('site.min.js'))
    .pipe(gulpTerser(terserOptions, terser.minify))
    .pipe(stripComments())
    .pipe(gulp.dest(paths.assets.js))
    .pipe(browsersync.stream());
  done();
}

// WATCH FILES
function watchFiles() {
  gulp.watch('config.rb', browserSync.exit);
  gulp.watch('gulpfile.js', touchConfig);
  gulp.watch(dirs.erb, browserSyncReload);
  gulp.watch([paths.watch.sass, paths.watch.js], gulp.series(gulpCSS, gulpJS, browserSyncReload));
};

// DEFINE TASKS
exports.default   = gulp.series(cleanUp, copyPDF, copyFonts, copyImages, webpImages, gulpCSS, copyJS, gulpJS, gulp.parallel(browserSync, watchFiles));
exports.buildProd = gulp.series(cleanUp, copyPDF, copyFonts, copyImages, webpImages, gulpCSS, copyJS, gulpJS,);

// CRITICALCSS
// INLINE SOURCE
function inlineSource(done) {
  return gulp
    .src('./build/**/*.html')
    .pipe(replace(/(<script.*<\/script>)(.*)<\/body>/, "$2$1</body>"))
    .pipe(replace('.js"></script>', '.js" inline></script>'))
    .pipe(replace('rel="stylesheet">', 'rel="stylesheet" inline>'))
    .pipe(inlinesource({
      compress: true
    }))
    .pipe(inlineImages({/* options */}))
    .pipe(gulp.dest(dirs.dest));
  done();
}

// MINIFY HTML
function minifyHTML(done) {
  return gulp
    .src('build/**/*.html')
    .pipe(plumber({
      errorHandler: meldeFehler
    }))
    .pipe(htmlclean())
    .pipe(htmlmin(htmlOptions))
    .pipe(gulp.dest(dirs.dest));
  done();
}

// DEFINE TASKS
// `criticalCSS` ist bewusst NICHT mehr in der Reihe.
//
// Es startet ueber Puppeteer einen kompletten Chromium-Browser, um zu messen,
// welches CSS im ersten Bildschirm sichtbar ist. Das mitgelieferte Chromium
// ist Build 722234 von 2020 - ein Intel-Programm. Auf Apple Silicon scheitert
// der Start mit "Unknown system error -86" (EBADARCH) und reisst den ganzen
// Build mit sich, weil der Fehler aus einem Kindprozess kommt und von plumber
// nicht aufgefangen wird.
//
// Der Nutzen stand ohnehin in schlechtem Verhaeltnis: ein 300-MB-Browser fuer
// ein paar Kilobyte frueher gerendertes CSS. Den grossen Gewinn bringt
// PurgeCSS, und das laeuft weiter - es wirft alles ungenutzte CSS hinaus.
//
// Das Paket `critical` ist deshalb ganz entfernt - es brachte Puppeteer 2.1.1
// von 2020 samt 300 MB Intel-Chromium mit und meldete sich bei jedem npm-Lauf
// als veraltet. Wer Critical CSS eines Tages wieder will, installiert es neu
// mit einem aktuellen Puppeteer - oder zeigt per `executablePath` auf einen
// bereits vorhandenen Browser wie Brave.
const optiCSS  = gulp.series(inlineSource, minifyHTML);
const optimize = gulp.series(optiCSS);

// EXPORT TASKS
exports.inlineSource = inlineSource;
exports.minifyHTML   = minifyHTML;
exports.optiCSS      = optiCSS;
exports.optimize     = optimize;
