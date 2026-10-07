###-----------------------------------
#  CONFIGURATION
#  ~> https://dd5md.de
###-----------------------------------

# IMPORT HELPERS
Dir['helpers/*.rb'].each(&method(:load))

# IMPORT LIBs
Dir['lib/*.rb'].each { |file| require file }

###-----------------------------------
#  ACTIVATE & CONFIG EXTENSIONS
###-----------------------------------

# I18N
# activate :i18n, mount_at_root: :de

# INLINE SVG
activate :inline_svg

# IMAGE SIZE HELPER
activate :automatic_image_sizes

# PAGEGROUPS
activate :MiddlemanPageGroups do |config|
  config.strip_file_prefixes   = true
  config.extend_page_class     = true
  config.nav_breadcrumbs_class = 'breadcrumbs'
end

###-----------------------------------
#  LAYOUT-SPECIFIC CONFIGURATION
###-----------------------------------

# RELATIVE LINKS
config[:relative_links] = true

# ASSETS PIPLINE SET
config[:css_dir]     = 'assets/stylesheets'
config[:js_dir]      = 'assets/javascripts'
config[:images_dir]  = 'assets/images'
config[:fonts_dir]   = 'assets/fonts'

# RELATIVE ASSETS
activate :relative_assets

# PRETTY URLs
activate :directory_indexes

# NO LAYOUT
[:xml, :json, :txt, :htaccess].each do |ext|
  page '/*.' + ext.to_s, layout: false
end

# NO LAYOUT
page '404.html', layout: false, directory_index: false

###-----------------------------------
#  EXTERNAL PIPELINE GULP.JS
###-----------------------------------

assets_dir = File.expand_path('.tmp/dist', __dir__)

activate :external_pipeline,
  name: :gulp,
  command: build? ? './node_modules/gulp/bin/gulp.js buildProd' : './node_modules/gulp/bin/gulp.js default',
  source: assets_dir,
  latency: 1

###-----------------------------------
#  SERVER-SPECIFIC CONFIGURATION
###-----------------------------------

configure :server do
  # DEBUG ASSETS
  config[:debug_assets] = true
end

###-----------------------------------
#  SITEMAP-SPECIFIC CONFIGURATION
###-----------------------------------

# SITEMAP PING
activate :sitemap_ping do |config|
  config.host         = 'https://dd5md.de'
  config.sitemap_file = '/sitemap.xml'
  config.ping_google  = true
  config.ping_bing    = false
  config.after_build  = false
end

###-----------------------------------
#  PRODUCTION-SPECIFIC CONFIGURATION
###-----------------------------------

configure :production do
  # HOST
  config[:host] = 'https://dd5md.de'
  # URL_ROOT
  config[:url_root] = 'https://dd5md.de'
  # IGNORE
  ignore 'statics/stylesheets/*'
  ignore 'statics/javascripts/*'
  ignore 'statics/images/*'
  ignore 'statics/*'
  ignore 'source/*'
  ignore '.DS_Store'
  # ASSET HASH
  activate :asset_hash, ignore: 'assets/images/**/*', exts: config[:asset_extensions] = %w(.woff) + %w(.woff2) + %w(.css) + %w(.js) + %w(.webp) + %w(.svg)
  # SITEMAP
  activate :search_engine_sitemap, default_priority: 0.5, default_change_frequency: 'weekly'
  # ROBOTS
  activate :robots,
            rules: [{ user_agent: '*', allow: %w[/], disallow: ['/404'] }],
            sitemap: config[:host] + '/sitemap.xml'
  # CLEANBUILD
  activate :clean_build
end
