ROOT ?= /deploy
LVL  ?= local

# package:
# Build the tar file suitable for upgrade.pl.  Called package.tar.gz, 
# in the current working directory.  All code must be checked in and
# pushed, since this target does a git-clone.
#
# For the package target to work, you must be able to
# git-clone without a password
package:
	mkdir -p package
	( cd package; git clone git@github.com:viblio/web-clients.git )
	( cd package/web-clients; tar --exclude .git -zcf ../../package.tar.gz . )
	rm -rf package

# install:
# This target is called by the sw installer on the target machine.  Does
# what is required to install the new software and activate it.
install:
	-rm -rf $(ROOT)/$(LVL)/web-clients.PRE
	-mv $(ROOT)/$(LVL)/web-clients $(ROOT)/$(LVL)/web-clients.PRE
	mkdir $(ROOT)/$(LVL)/web-clients
	tar zxf package.tar.gz -C $(ROOT)/$(LVL)/web-clients
	/etc/init.d/nginx restart

# bump:
# This will actually run upgrade.pl to initiate a software upgrade.  You must
# indicate which domain to upgrade: LVL=staging or LVL=prod.  If LVL is set to
# prod, you must be on a machine in the VPC that has access to the production
# database.
bump:
	upgrade.pl -db $(LVL) -app webgui -bump -f package.tar.gz
