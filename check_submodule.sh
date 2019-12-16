#!/bin/bash
### Script will check Verus-GUI submodule in gui folder.
### If you used git clone without --recursive option this is way to go.

PWD=`pwd`
SIZE=`du -sk gui/Verus-GUI`

echo "Checking Verus-GUI folder."
cd gui/Verus-GUI && \
git submodule update --recursive && \
cd ../.. && \
echo "Folder looks fine." || \
echo "Some problem with cloning submodule Verus-GUI."
echo
