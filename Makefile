ROOT ?= /deploy
LVL  ?= staging
APPNAME   = web-clients

# This picks up only files under revision control
FILES = $(shell git ls-tree -r master --name-only)

# package:
# Build the tar file suitable for upgrade.pl.  Called package.tar.gz, 
# in the current working directory.  All code must be checked in and
# pushed, since this target does a git-clone.
#
# For the package target to work, you must be able to
# git-clone without a password
package:
	tar zcf package.tar.gz $(FILES)

# install:
# This target is called by the sw installer on the target machine.  Does
# what is required to install the new software and activate it.
install:
	mkdir -p $(ROOT)/$(LVL)/$(APPNAME).next
	tar zxf package.tar.gz -C $(ROOT)/$(LVL)/$(APPNAME).next
	-rm -rf $(ROOT)/$(LVL)/$(APPNAME).pre
	-mv $(ROOT)/$(LVL)/$(APPNAME) $(ROOT)/$(LVL)/$(APPNAME).pre
	-mv $(ROOT)/$(LVL)/$(APPNAME).next $(ROOT)/$(LVL)/$(APPNAME)

# bump:
# This will actually run upgrade.pl to initiate a software upgrade.  You must
# indicate which domain to upgrade: LVL=staging or LVL=prod.  If LVL is set to
# prod, you must be on a machine in the VPC that has access to the production
# database.
bump:
	upgrade.pl -db $(LVL) -app webgui -bump -f package.tar.gz

# versions:
# List cureent versions
versions:
	upgrade.pl -db $(LVL) -app webgui -check
