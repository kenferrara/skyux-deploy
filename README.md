# sky-pages-deploy
Deployment package for sky-pages

## Install

`npm install -g blackbaud/sky-pages-deploy`

## Usage

`sky-pages-deploy`

## Options

All of the following options are required and overridable via the CLI.  For example, to set the name of the SPA the command would be:

`sky-pages-deploy --name MySPA`

| Option                  | Default |
| ----------------------- | ------- |
| `name`                  | `null` |
| `version`               | `version` property in `package.json` |
| `skyuxVersion`          | `_requested.spec` in the `package.json` file in `./node_modules/blackbaud-skyux2/` |
| `azureStorageAccount`   | `null`  |
| `azureStorageAccessKey` | `null`  |
| `azureStorageTableName` | "spa"   |

`null` values are typically supplied by the CI process.
