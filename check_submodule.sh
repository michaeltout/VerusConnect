#!/bin/bash
### Script will check Verus-Desktop-GUI submodule in gui folder.
### If you used git clone without --recursive option this is way to go.

PWD=`pwd`
SIZE=`du -sk gui/Verus-Desktop-GUI`

echo "Checking Verus-Desktop-GUI folder."
cd gui/Verus-Desktop-GUI && \
git submodule update --recursive && \
cd ../.. && \
echo "Folder looks fine." || \
echo "Some problem with cloning submodule Verus-Desktop-GUI."
echo
