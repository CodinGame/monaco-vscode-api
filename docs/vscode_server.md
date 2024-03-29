# How to install and use VSCode server with monaco-vscode-api

## Install VSCode server

Get the commit_sha of the proper VSCode version by running: 
```bash
curl https://raw.githubusercontent.com/CodinGame/monaco-vscode-api/v<monaco_vscode_api_version>/package.json | jq -r '.["config"]["vscode"]["commit"]'
```
(replace `<monaco_vscode_api_version>` by the version of monaco-vscode-api, starting from `3.2.3`)

Then download the server:

### For VScode server

Download `https://update.code.visualstudio.com/commit:${commit_sha}/server-<platform>-<arch>/stable`

Replace:
- `<platform>` by either `win32`, `linux` or `darwin`
- `<arch>` by either `arm64`, `x64` or `armhf`

For instance: <https://update.code.visualstudio.com/commit:863d2581ecda6849923a2118d93a088b0745d9d6/server-linux-x64/stable>

### For VSCodium server

Get `reh` release from <https://github.com/VSCodium/vscodium/releases>

For instance: `vscodium-reh-linux-x64-1.87.2.24072.tar.gz`

## Installation
Untar the archive in the install directory:

```bash
mkdir -p <install_directory> && tar --no-same-owner -xzv --strip-components=1 -C <install_directory> -f <archive>
```

It's also possible to extract the archive on the fly while downloading it:
```bash
curl -L --max-redirs 5 https://update.code.visualstudio.com/commit:863d2581ecda6849923a2118d93a088b0745d9d6/server-linux-x64/stable | tar -xz -C . --strip-components=1
```

## Configuration

In the install directory, edit the file `product.json` and make sure:
- The `commit` field correspond to the `commit_sha` found earlier (especially for VSCodium)
- The `webEndpointUrlTemplate` contains the url of the app that will be using monaco-vscode-api (example: `https://my.domain.com/`) (create the field if it doesn't exists)

Example:
```bash
cat <<< "$(jq ".webEndpointUrlTemplate = \"https://my.domain.com/\"" product.json)" > product.json
cat <<< "$(jq ".commit = \"863d2581ecda6849923a2118d93a088b0745d9d6\"" product.json)" > product.json
```

### advanced

The `commit` should correspond to what is configured in the client, which is by default the VSCode commit used to build the lib, but it can be overriden by providing `configuration.productConfiguration.commit` to the service initialization function.

## Running the server

From the install directory, run:

```bash
./bin/code-server --port 8080 --without-connection-token --accept-server-license-terms --host 0.0.0.0
```

(or `./bin/codium-server`) for VSCodium

Note: it starts the service on every interfaces and without a security token just to simplify the usage, but do not use it as is in production


## Using the server

- Add the `remoteAgent` service override (`@codingame/monaco-vscode-remote-agent-service-override`)
- Configure the url of the remote server by providing a `remoteAuthority` to the service initialization function configuration. It should only contain the authority (domain/ip and port, example: `localhost:8080`). You can also provide a `connectionToken` if the server is configured to expect it.
- You can now use a remote directory as workspace by using the `vscode-remote` scheme. for instance : `vscode-remote://localhost:8080/my/project/directory`

## Testing it in the demo

Run the demo, then go to <http://localhost:5173/?remoteAuthority=localhost:8080>

You can also go to <http://localhost:5173/?remoteAuthority=localhost:8000&remotePath=/any/path/on/your/machine> to open a directory on your machine as the current workspace

## Production concerns

The commit and product quality should be the same on the client and on the server to be able to connect them. It can be an issue if you have the server deployed on a cluster, and the client is upgraded progressively: it is required for the server to expose both old and new version.

It can be achieved because all calls to the server are prefixed by `<quality>-<commit>`. So both servers can be started on a different port, and a reverse proxy in front of them can redirect the calls based on the path prefix.