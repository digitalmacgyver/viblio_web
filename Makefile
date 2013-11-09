ROOT ?= /deploy
LVL  ?= local

# For the package target to work, you must be able to
# git-clone without a password
package:
	mkdir -p package
	( cd package; git clone git@github.com:viblio/web-clients.git )
	( cd package/web-clients; tar --exclude .git -zcf ../../package.tar.gz . )
	rm -rf package

install:
	-rm -rf $(ROOT)/$(LVL)/web-clients.PRE
	-mv $(ROOT)/$(LVL)/web-clients $(ROOT)/$(LVL)/web-clients.PRE
	mkdir $(ROOT)/$(LVL)/web-clients
	tar zxf package.tar.gz -C $(ROOT)/$(LVL)/web-clients
	/etc/init.d/nginx restart
