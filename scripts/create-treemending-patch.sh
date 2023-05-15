#!/bin/bash
set -e

dir_me=$(realpath $(dirname $0))
dir_base=$(realpath $dir_me/..)

build_directory=$1
monaco_esm_directory=${dir_base}/node_modules/monaco-editor/esm
editor_patch_file=${dir_base}/monaco-editor-treemending.patch

echo "Starting treemending process"

cd $build_directory

# build editor without treeshaking to generate the treemending patch
echo "Installing build dependencies"
which node
cd build
yarn install --ignore-engines
cd ..

mkdir -p editor-patch
cp -R $monaco_esm_directory editor-patch/a
cp -R $monaco_esm_directory editor-patch/b
## Change shake level from ClassMembers to Files
sed -i 's/shakeLevel: 2/shakeLevel: 0/g' build/gulpfile.editor.js
npx gulp editor-distro
cd out-monaco-editor-core/esm/
cp --parents $(find -name \*.js) ../../editor-patch/b
cd ../../editor-patch
diff -urN -x '*.map' a b > "$editor_patch_file" || true 
cd ..

cd $dir_base
node --loader ts-node/esm $dir_base/src/monaco-calc-hashes.ts $build_directory/editor-patch/b $dir_base/monaco-editor-hashes.txt

echo "Completed treemending process"
