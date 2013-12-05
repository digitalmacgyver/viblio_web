NODE = /usr/local/bin/node
NPM  = /usr/local/bin/npm
WEYLAND = /usr/local/bin/weyland

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

$(WEYLAND):
	@if [ `id -u -n` != 'root' ]; then \
	  echo You must be root to install weyland. ;\
	  echo Please run: sudo make $(WEYLAND) ;\
	  exit 1 ;\
	fi
	$(NPM) install -g weyland
