# How to upgrade to next vscode and monaco-editor versions

## Preparation

- It is assumed `monaco-vscode-api`, `vscode` and `monaco-editor` repos are cloned locally on the same directory level. `monaco-editor` is not required, but helpful

## vscode repository

- Get the new vscode commit from the new monaco-editor release version (in the package.json there is a `vscodeRef` field)
- Go to the vscode repo directory, reset to the previous vscodeRef commit
- Apply the current patch: `patch -p1 < ../monaco-vscode-api/scripts/vscode.patch`
- `git stash`
- Checkout new vscodeRef commit
- `git stash pop`
- Resolve conflicts / update code (e.g. broken imports)
- Generate new patch: `git diff --staged > ../monaco-vscode-api/scripts/vscode.patch`

## monaco-vscode-api repository

- Update the package.json to set `monaco-editor` to the same version as the one using the `vscodeRef` from above (usually the latest version)
- Run `npm install` which will trigger the vscode install script
- Wait for the new vscode version to be downloaded and built
- Run `npm run update-vscode-dependencies` to update the vscode dependencies we use to the same versions as vscode
- Run `npm install` (might need to update/add the npm override for `xterm` in the `package.json` to fix the invalid peer deps)
- Fix errors, adapt code, build, include the `vscode.patch` into this commit
  - Do not hesitate to run the eslint autofix, it gets rid of the majority of your errors
  - Implement missing services. This is easily observable seem when running the demo (see next point)
- Update demo
  - Update dependencies
  - Implement improvements dependening on the new features available from vscode (optional)

## Hints

Use repo log viewers and check the last update branch when in doubt
