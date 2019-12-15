#!/bin/bash
### Script will check VerusConnect-GUI submodule in gui folder.
### If you used git clone without --recursive option this is way to go.

PWD=`pwd`
SIZE=`du -sk gui/VerusConnect-GUI`

echo "Checking VerusConnect-GUI folder."
cd gui/VerusConnect-GUI && \
git submodule update --recursive && \
cd ../.. && \
echo "Folder looks fine." || \
echo "Some problem with cloning submodule VerusConnect-GUI."
echo
