###-----------------------------------
#  Configuration
#  ~> https://dd5md.de
###-----------------------------------

# Import Helpers
Dir['helpers/*.rb'].each(&method(:load))

# Import Lib
Dir['lib/*.rb'].each { |file| require file }

# Load Sass
config[:sass_assets_paths] << File.join(root, 'node_modules')

###-----------------------------------
#  Activate & Config Extensions
###-----------------------------------

# Inline SVG
activate :inline_svg

# Pagegroups
activate :MiddlemanPageGroups do |options|
  options[:strip_file_prefixes]   = true
  options[:extend_page_class]     = true
  options[:nav_breadcrumbs_class] = 'breadcrumbs'
end

###-----------------------------------
#  Layout-Specific Configuration
###-----------------------------------

# Relative Links
config[:relative_links] = false

# Assets Pipeline Set
config[:css_dir]    = 'assets/stylesheets'
config[:js_dir]     = 'assets/javascripts'
config[:images_dir] = 'assets/images'
config[:fonts_dir]  = 'assets/fonts'

# Relative Assets
activate :relative_assets

# Pretty URLs
activate :directory_indexes

# No Layout
[:xml, :json, :txt, :htaccess].each do |ext|
  page '/*.' + ext.to_s, layout: false
end

# No Layout
page '404.html', layout: false, directory_index: false

###-----------------------------------
#  External-Pipline Configuration
###-----------------------------------

assets_dir = File.expand_path('.tmp/dist', __dir__)

activate :external_pipeline,
  name: :gulp,
  command: build? ? './node_modules/gulp/bin/gulp.js buildProd' : './node_modules/gulp/bin/gulp.js default',
  source: assets_dir,
  latency: 1

###-----------------------------------
#  Development-Specific Configuration
###-----------------------------------

configure :development do
  # Debug Assets
  config[:debug_assets] = true
end

###-----------------------------------
#  Sitemap-Specific Configuration
###-----------------------------------

# Sitemap Ping
activate :sitemap_ping do |config|
  config.host         = 'https://dd5md.de'
  config.sitemap_file = '/sitemap.xml'
  config.ping_google  = true
  config.ping_bing    = false
  config.after_build  = false
end

###-----------------------------------
#  Production-Specific Configuration
###-----------------------------------

configure :production do
  # Host
  config[:host] = 'https://dd5md.de'
  # URL_Root
  config[:url_root] = 'https://dd5md.de'
  # Ignore
  ignore 'statics/stylesheets/*'
  ignore 'statics/javascripts/*'
  ignore 'statics/images/*'
  ignore 'statics/*'
  ignore 'source/*'
  ignore '.DS_Store'
  # ASSET HASH
  activate :asset_hash, ignore: 'assets/images/**/*', exts: config[:asset_extensions] = %w(.woff) + %w(.woff2) + %w(.css) + %w(.js) + %w(.webp) + %w(.svg)
  # Sitemap
  activate :search_engine_sitemap, default_priority: 0.5, default_change_frequency: 'weekly'
  # Robots
  activate :robots,
            rules: [{ user_agent: '*', allow: %w[/], disallow: ['/404'] }],
            sitemap: config[:host] + '/sitemap.xml'
  # Clean Build
  activate :clean_build
end
