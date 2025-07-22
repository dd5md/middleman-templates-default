###-----------------------------------
#  Configuration
#  ~> https://dd5md.de
###-----------------------------------
require 'htmlcompressor'
require 'yui/compressor'
require 'terser'

# Import Helpers
# Dir['helpers/*.rb'].each(&method(:load))

# Import Lib
# Dir['lib/*.rb'].each { |file| require file }

# Load Sass
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

# Inline SVG
activate :inline_svg

# Pagegroups
# activate :MiddlemanPageGroups do |options|
#   options[:strip_file_prefixes]   = true
#   options[:extend_page_class]     = true
#   options[:nav_breadcrumbs_class] = 'breadcrumbs'
# end

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
#  Development-Specific Configuration
###-----------------------------------

configure :development do
  # Debug Assets
  config[:debug_assets] = true
  # Config Port
  config[:port] = '7001'
  # Activate Livereload
  activate :livereload, no_swf: true, apply_css_live: true, livereload_css_target: 'nil'
end

###-----------------------------------
#  Production-Specific Configuration
###-----------------------------------

configure :production do
  # Asset Hash
  activate :asset_hash
  # Minify CSS on Build
  activate :minify_css, inline: true, compressor: YUI::CssCompressor.new
  # Minify HTML on Build
  activate :minify_html
  # Minify JS on Build
  activate :minify_javascript, inline: true, compressor: Terser.new
end
