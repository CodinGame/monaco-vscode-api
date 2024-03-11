# How to upgrade to next vscode and monaco-editor versions

## Preparation

- It is assumed `monaco-vscode-api` and `vscode` repos are cloned locally on the same directory level.

## vscode repository

- Get The tag of the VSCode version from the [VSCode github](https://github.com/microsoft/vscode/tags)
- Go to the VSCode repo directory, reset to the previous VSCode tag (`config.vscode.ref` from monaco-vscode-api `package.json`)
- Apply the current patch: `patch -p1 < ../monaco-vscode-api/scripts/vscode.patch`
- `git stash`
- Checkout new VSCode tag
- `git stash pop`
- Resolve conflicts / update code (e.g. broken imports)
- Generate new patch: `git diff --staged > ../monaco-vscode-api/scripts/vscode.patch`

## monaco-vscode-api repository

- Update the `package.json` to set `config.vscode.ref` to the new VSCode tag from above
- Run `npm install` which will trigger the vscode install script
- Wait for the new vscode version to be downloaded and built
- Run `npm run update-vscode-dependencies` to update the vscode dependencies we use to the same versions as VSCode
- Run `npm install` (might need to update/add the npm override for `xterm` in the `package.json` to fix the invalid peer deps)
- Fix errors, adapt code, build, include the `vscode.patch` into this commit
  - Do not hesitate to run the eslint autofix, it gets rid of the majority of your errors
  - Implement missing services. This is easily observable seem when running the demo (see next point)
- Update demo
  - Update dependencies
  - Implement improvements dependening on the new features available from vscode (optional)
  - Don't forget to check the `Window` output (in the `OUTPUT` panel tab) to check for errors

## Hints

Use repo log viewers and check the last update branch when in doubt
