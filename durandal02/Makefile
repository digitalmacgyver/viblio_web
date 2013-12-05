# This makefile is used to optimize javascript, view templates
# and css for a production system.  Running "make" here creates
# ./build, which is the new top of the production tree, and
# includes build/app/main-built.js (the compressed durandal app)
# and build/css/styles.min.css (the compressed vendor and application
# css files).  Styles.min.css is compressed from css/styles.css
# using r.js manually.  The durandal app is compressed using
# weylend (the durandal project optimizer) using weyland-config.js.
# Note that vender javascript is NOT optimized in this flow. It
# probably could be using r.js manually, but weyland has a very
# difficult time combining vendor js with the app js.
#
# Weyland must be installed on your build machine.  You have to
# do this as root:  sudo make /usr/local/bin/weyland.
#
# index-opt.html is copied to build/index.html and will be
# the production web page.  It is slighly different than
# ./index.html in that it references the compressed javascript
# and css files.
#
NODE = /usr/local/bin/node
NPM  = /usr/local/bin/npm
WEYLAND = /usr/local/bin/weyland
RJS = /usr/local/lib/node_modules/weyland/node_modules/.bin/r.js

optimize: $(WEYLAND)
	$(RM) -rf build app/main-built.js
	$(NODE) $(WEYLAND) build
	# Copy the css, image, font and other resources
	tar zcf - `find . -name "*.css" \
		-o -name "*.png" \
		-o -name "*.gif" \
		-o -name "*.cur" \
		-o -name "*.ttf" \
		-o -name "*.woff" \
		-o -name "*.swf"` | (cd build; tar zxf -)
	cp -f index-opt.html build/index.html
	# Optimize the styles.css file
	$(RJS) -o opt-css.js

$(WEYLAND):
	@if [ `id -u -n` != 'root' ]; then \
	  echo You must be root to install weyland. ;\
	  echo Please run: sudo make $(WEYLAND) ;\
	  exit 1 ;\
	fi
	$(NPM) install -g weyland
