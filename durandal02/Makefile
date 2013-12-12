# This makefile is used to optimize javascript, view templates
# and css for a production system.  Running "make" here creates
# ./build, which is the new top of the production tree, and
# includes build/app/main-built.js (the compressed durandal app)
# and build/css/styles.min.css (the compressed vendor and application
# css files).  Styles.min.css is compressed from css/styles.css
# using r.js manually.  The durandal app is compressed using
# weylend (the durandal project optimizer) using weyland-config.js.
# The vender javascript is optimized using r.js sperately.
#
# index-opt.html is copied to build/index.html and will be
# the production web page.  It is slighly different than
# ./index.html in that it references the compressed javascript
# and css files.
#
# The "lint" target runs a custom little script on our javascript
# code and prints a report.  The make will fail if there are any
# errors.  This tool (jlint) is configured with package.json.
#
NODE = node
NPM  = npm
WEYLAND = node_modules/weyland/bin/cli.js
RJS = node_modules/weyland/node_modules/.bin/r.js
NODE_MINIFY = node_modules/node-minify

optimize: $(WEYLAND) $(NODE_MINIFY)
	$(RM) -rf build app/main-built.js
	$(NODE) $(WEYLAND) build 
	# Copy the css, image, font and other resources
	tar zcf - `find . -name "*.css" \
		-o -name "*.png" \
		-o -name "*.jpg" \
		-o -name "*.gif" \
		-o -name "*.cur" \
		-o -name "*.ttf" \
		-o -name "*.woff" \
		-o -name "*.swf"` | (cd build; tar zxf -)
	cp -f index-opt.html build/index.html
	# Optimize the styles.css file
	$(RJS) -o opt-css.js
	# Optimize the vendor javascript
	$(NODE) vendor-opt.js

$(WEYLAND):
	$(NPM) install weyland

$(NODE_MINIFY): 
	$(NPM) install node-minify

lint: node_modules/glob/glob.js
	$(NODE) jlint 

node_modules/glob/glob.js:
	$(NPM) install
