### This is experimental and unfinished software. Use at your own risk! No warranty for any kind of damage!

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

# Agama Wallet
Verus-enhaced Komodo Desktop Multicoin Wallet

## Build & Installation

#### Prerequirements:

1) [Install yarn](https://yarnpkg.com/)

2) [Install git](https://git-scm.com/)


#### Build & Start EasyDEX-GUI (frontend)

```shell
git clone --recursive https://github.com/VerusCoin/Agama --branch master --single-branch
cd agama/gui/EasyDEX-GUI/react/
yarn update && yarn install 
```
Leave the above process running and use a new terminal windows/tab when proceeding with the below steps.

Now please create a directory called `bin` inside `assets/` and afterwards copy `komodod` and `komodo-cli` to a new subfolder named after the operating system you are building Agama for: `linux64`, `osx` or `win64`. 
From within `agama/` the structure will be `assets/bin/linux64` (for example on linux).


#### Start Agama App (electron)

```shell
cd Agama
yarn install
yarn start
```
To use debug/dev mode please stop Agama App (electron) and either set `dev: true` and `debug: true` in `~/.agama/config.json` and then restart the app or replace step 4) from above with the start command below:

```shell
yarn start devmode
```

You re ready to dev!


## Bundling & packaging:

```shell
yarn run dist
```
We refer to the original [electron-builder](https://www.electron.build) website for more detailed information and further documentation.


