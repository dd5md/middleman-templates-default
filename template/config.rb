###-----------------------------------
#  Configuration
#  ~> https://dd5md.de
###-----------------------------------
require 'htmlcompressor'
require 'yui/compressor'
require 'terser'

# Import Helpers
Dir['helpers/*.rb'].each(&method(:load))

# Import Libs
Dir['lib/*.rb'].each { |file| require file }

# Sass Assets Path
config[:sass_assets_paths] << File.join(root, 'node_modules')

###-----------------------------------
#  Activate & Config Extensions
###-----------------------------------

# Autoprefixer
activate :autoprefixer do |config|
  config.browsers = ['last 2 version']
  config.cascade  = false
  config.inline   = true
end

# I18N
activate :i18n, mount_at_root: :de

# INLINE SVG
activate :inline_svg

# Image Size Helper
activate :automatic_image_sizes

# Per-Page Layout Changes
page '/*.xml', layout: false
page '/*.json', layout: false
page '/*.txt', layout: false

###-----------------------------------
#  Helpers
###-----------------------------------

# helpers do
#   def some_helper
#     'Helping'
#   end
# end

###-----------------------------------
#  Layout-Specific CONFIGURATION
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

# Pretty URL's
activate :directory_indexes

# Per-Page Layout changes
[:xml, :json, :txt, :htaccess].each do |ext|
  page '/*.' + ext.to_s, layout: false
end

# Per-Page Layout changes
page '404.html', layout: false, directory_index: false

###-----------------------------------
#  Server-SPECIFIC CONFIGURATION
###-----------------------------------

configure :server do
  # Debug Assets
  config[:debug_assets] = true
  # Asset hash
  activate :asset_hash do |f|
    f.ignore = [/images\/ogp\/\S+\.(png|jpg|gif)/]
  end
  # Config Port
  config[:port] = '7001'
  # Activate Livereload
  activate :livereload, no_swf: true, apply_css_live: true
end

###-----------------------------------
# Build-specific Configuration
###-----------------------------------

configure :build do
  # Host
  config[:host] = 'https://dd5md.de'
  # URL_Root
  config[:url_root] = 'https://dd5md.de'
  # Asset hash
  activate :asset_hash do |f|
    f.ignore = [/images\/ogp\/\S+\.(png|jpg|gif)/]
  end
  # Minify CSS on Build
  activate :minify_css, inline: true, compressor: YUI::CssCompressor.new
  # Minify HTML on Build
  activate :minify_html do |config|
    config.remove_quotes = false
    config.remove_input_attributes = false
    config.remove_style_attributes = false
    config.remove_link_attributes  = false
  end
  # Minify JS on Build
  activate :minify_javascript, compressor: Terser.new
  # Robots
  activate :robots,
            rules: [{ user_agent: '*', allow: %w[/], disallow: ['/404'] }],
            sitemap: config[:host] + '/sitemap.xml'
  # Clean Build
  activate :clean_build
end
