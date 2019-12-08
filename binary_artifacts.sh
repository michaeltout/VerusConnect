echo Refreshing binaries from github releases [https://github.com/komodoplatform/komodo]
echo =========================================
echo Step: Cleaning up working dir
pwd
[ ! -d assets ] && \
  mkdir -p assets
cd assets
rm -rf bin
[ -d artifacts.supernet.org ] && \
  echo Removing old artifacts. && \
  rm -rvf artifacts.supernet.org
echo
echo =========================================
echo Step: Downloading latest LINUX komodo binaries from github
curl -s https://api.github.com/repos/KomodoPlatform/komodo/releases \
  | grep browser_download_url \
  | grep linux_master \
  | cut -d '"' -f 4 \
  | wget -qi -
tar xvfz komodo_linux_master.tar.gz
mv -Tf src bins_linux/
echo =========================================
echo Step: Downloading latest WIN komodo binaries from github
curl -s https://api.github.com/repos/KomodoPlatform/komodo/releases \
  | grep browser_download_url \
  | grep win64_master \
  | cut -d '"' -f 4 \
  | wget -qi -
unzip komodo_win64_master.zip
mv komodo_win_master bins_win/
cd ..
echo =========================================
echo
pwd
echo =========================================
mkdir assets/bin
mkdir assets/bin/osx
echo Moving OSX komodo bins to assets/bin/osx
wget https://supernetorg.bintray.com/binaries/kmd_osx_bins.zip
checksum=`shasum -a 256 kmd_osx_bins.zip | awk '{ print $1 }'`
if [ "$checksum" = "4bb33149e4322d6d4a4c9ea41c3baa33ce125c4f2ccb7e7336fcd4f295ea5351" ]; then
    echo "Checksum is correct."
    unzip kmd_osx_bins.zip
    cp -rvf kmd_osx_bins/* assets/bin/osx/.
  else
    echo "Checksum is incorrect!"
    exit 0
fi

# echo Moving legacy libs to assets/bin
# wget https://supernetorg.bintray.com/misc/libs_legacy_osx.zip
# checksum=`shasum -a 256 libs_legacy_osx.zip | awk '{ print $1 }'`
# if [ "$checksum" = "e9474aa243694a2d4c87fccc443e4b16a9a5172a24da76af9e5ecddd006649bb" ]; then
#     echo "Checksum is correct."
#     unzip libs_legacy_osx.zip
#     cp -rvf libs_legacy_osx/* assets/bin/osx/.
#   else
#     echo "Checksum is incorrect!"
#     exit 0
# fi

echo =========================================
echo Moving Windows binaries to assets/bin/win64/
mv -T assets/win64 assets/bin/win64/
echo
echo =========================================
echo Set permission +x for linux64 binaries
chmod +x assets/bins_linux/komodo*
echo Moving Linux komodo bins to assets/bin
mv -T assets/bins_linux assets/bin/linux64/
echo
echo =========================================
echo Finished Updating binaries from github
echo
