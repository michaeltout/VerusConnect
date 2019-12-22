cd gui/Verus-Desktop-GUI/react
echo "building gui..."
rm -rf ./build
mkdir build
mkdir build/assets
cp -R src/assets build/
NODE_ENV="production" webpack
cd ../../../
echo "copy patch files"
rm -rf ./patch.zip
rm -rf ./patch
mkdir patch
mkdir patch/gui
mkdir patch/gui/Verus-Desktop-GUI
mkdir patch/gui/Verus-Desktop-GUI/react
mkdir patch/gui/Verus-Desktop-GUI/react
cp -R gui/Verus-Desktop-GUI/react/build patch/gui/Verus-Desktop-GUI/react/build
cp -R gui/Verus-Desktop-GUI/assets patch/gui/Verus-Desktop-GUI
cp -R gui/startup patch/gui/startup
cp ./main.js patch
cp ./version patch
cp -R routes patch/routes
cp -R private patch/private
echo "package patch.zip"
cd patch
zip -r patch.zip gui routes private main.js version
cd ../
cp patch/patch.zip ./
rm -rf patch
echo "patch.zip is ready"
