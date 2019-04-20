#-------------------------------------
# https://dd5md.de Configuration
#-------------------------------------

#-------------------------------------
#  Dir Helpers
#-------------------------------------

# Helpers Reload
Dir['helpers/*'].each(&method(:load))

#-------------------------------------
#  Activate & Configure Extensions
#-------------------------------------

# i18n
activate :i18n, mount_at_root: :de

# Autoprefixer
activate :autoprefixer do |prefix|
  prefix.browsers = 'last 4 versions'
  prefix.cascade  = false
end

#-------------------------------------
# Layout-specific Configuration
#-------------------------------------

# With no Layout
[:xml, :txt, :json].each do |ext|
  page '/*.' + ext.to_s, layout: false
end

#-------------------------------------
# Development-specific Configuration
#-------------------------------------

configure :development do
  # Livereload
  activate :livereload do |reload|
    reload.no_swf = true
  end
end

#-------------------------------------
# External Pipeline
#-------------------------------------

activate :external_pipeline,
  name: :gulp,
  command: build? ? 'npm run gulp' : 'npm run watch',
  source: '.tmp'
