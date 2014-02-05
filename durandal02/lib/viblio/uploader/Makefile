NODE = node
NPM  = npm
WEYLAND = node_modules/weyland/bin/cli.js
RJS = node_modules/weyland/node_modules/.bin/r.js
NODE_MINIFY = node_modules/node-minify

optimize: $(NODE_MINIFY)
	# Optimize the vendor javascript
	$(NODE) opt.js

$(NODE_MINIFY): 
	$(NPM) install node-minify

lint: node_modules/glob/glob.js
	$(NODE) jlint 

node_modules/glob/glob.js:
	$(NPM) install
