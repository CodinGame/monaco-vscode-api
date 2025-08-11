# How to upgrade to next vscode and monaco-editor versions

## Preparation

- It is assumed `monaco-vscode-api` and `vscode` repos are cloned locally on the same directory level.

## vscode repository

- Get The tag of the VSCode version from the [VSCode github](https://github.com/microsoft/vscode/tags)
- Go to the VSCode repo directory, reset to the previous VSCode tag (`config.vscode.ref` from monaco-vscode-api `package.json`)
- Apply the current patch: `git am ../monaco-vscode-api/vscode-patches/*.patch`
- Fetch the new tag: `git fetch origin <tag>`
- rebase on the new tag: `git rebase <tag>`
- Resolve conflicts / update code (e.g. broken imports)
- Generate new patch: `rm -rf ../monaco-vscode-api/vscode-patches && git format-patch --zero-commit --no-numbered --no-signature <tag>.. -o '../monaco-vscode-api/vscode-patches'`

## monaco-vscode-api repository

- Update the `package.json` to set `config.vscode.ref` to the new VSCode tag from above
- Update the `package.json` to set `config.monaco.ref` to the new version of monaco-editor
- Run `npm install` which will trigger the vscode install script
- Wait for the new vscode version to be downloaded and built
- Run `npm run update-vscode-dependencies` to update the vscode dependencies we use to the same versions as VSCode
- Run `npm install` (might need to update/add the npm override for `xterm` in the `package.json` to fix the invalid peer deps)
- Fix errors, adapt code, build, include the `vscode-patches` directory into this commit
  - Do not hesitate to run the eslint autofix, it gets rid of the majority of your errors
  - Implement missing services. This is easily observable seem when running the demo (see next point)
    - you can also use the commmand `git diff <previousTag> <newTag> -G'registerSingleton\('` in the vscode repo to list the changes to the services
  - Make sure slightly transformed duplicated files are up to date with VSCode (in `src/assets`)
- Update demo
  - Update dependencies
  - Implement improvements dependening on the new features available from vscode (optional)
  - Don't forget to check the `Window` output (in the `OUTPUT` panel tab) to check for errors
  - Check all possible combinations
    - Full workbench mode or not
    - Shadow dom mode or not
    - Using VSCode server
    - Using HTML file system provider
    - Sandbox mode
    - ...
- Make the commit that updates the vscode version a breaking change commit: by adding `!` before the `:` in the commit message

## monaco-vscode-api demo

- In the demo, run `npm run update-local-dependencies`
- Then make sure to install the new versions of the dependencies: `rm -rf node_modules package-lock.json && npm install`

## Hints

Use repo log viewers and check the last update branch when in doubt
