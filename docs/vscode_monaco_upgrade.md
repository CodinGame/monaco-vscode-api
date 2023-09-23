# How to upgrade to next vscode and monaco-editor version

## Preparation

- Get the new vscode commit from the new monaco-editor release version (in the package.json there is a `vscodeRef` field)
- Open the vscode repo, reset to the previous vscodeRef commit
- Apply the current patch: `patch -p1 < /path/to/monaco-vscode-api/scripts/vscode.patch`
- `git stash`
- checkout new vscodeRef commit
- `git stash pop`
- resolve conflicts, update code...
- generate new patch: `git diff --staged > /path/to/monaco-vscode-api/scripts/vscode.patch`

## the monaco-vscode-api side

- update monaco-editor (and other dependencies) and update to the new `vscodeRef`
- wait for the new vscode version to be downloaded and built
- Fix errors, adapt code, build, include the `vscode.patch` into this commit
- update demo

## Further points (needs polishing / ne integrated properly)

- Do not hesitate to run the eslint autofix, it gets rid of the majority of your errors
- I've just realized we need to run npx @vscode/dts dev after an update (to upate the vscode.proposed.xxx.d.ts files): it fixes the error in api.ts
- The remaining errors in missing-services.ts are not hard to fix
- Implement missing services (usually seem when running the demo)
