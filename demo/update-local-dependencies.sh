#!/bin/bash
set -e

output=$(realpath "./packages")
echo $output

for dir in ../dist/packages/*; do
  if [ -d "$dir" ]; then
    echo $dir
    cd "$dir" 

    npm pack --pack-destination "$output"

    cd - > /dev/null || exit
  fi
done

npm install packages/*