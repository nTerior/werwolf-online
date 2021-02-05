pushd .
cd assets
convert -resize x128 -gravity center -crop 128x128+0+0 icon.png -flatten -colors 256 -background transparent favicon.ico
popd
