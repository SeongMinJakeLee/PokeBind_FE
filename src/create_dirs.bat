@echo off
cd /d "C:\Users\jake3\jake\pokemon-tcg-dex\frontend\src"
if not exist pages md pages
if not exist styles md styles
if not exist components md components
echo Directories created successfully
dir
