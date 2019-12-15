cd gui/VerusConnect-GUI/react
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
mkdir patch/gui/VerusConnect-GUI
mkdir patch/gui/VerusConnect-GUI/react
mkdir patch/gui/VerusConnect-GUI/react
cp -R gui/VerusConnect-GUI/react/build patch/gui/VerusConnect-GUI/react/build
cp -R gui/VerusConnect-GUI/assets patch/gui/VerusConnect-GUI
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
