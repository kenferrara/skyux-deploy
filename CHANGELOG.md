# 1.0.0 (2017-09-26)

- Returning non-zero exit code if no assets are found during `deploy`. [#21](https://github.com/blackbaud/skyux-deploy/pull/21)

# 1.0.0-beta.5 (2017-06-02)

- Fixed bug parsing `JSON` files when a BOM was present.
- If `deploy` or `release` step fails, return a non-zero exit code.

# 1.0.0-beta.4 (2017-05-01)

- Uploading assets as block blobs instead of append blobs to Azure. 

# 1.0.0-beta.3 (2017-04-28)

- Adding missing `glob` dependency.

# 1.0.0-beta.2 (2017-04-28)

- Deploying any files in `dist/assets`. [#14](https://github.com/blackbaud/skyux-deploy/pull/14)

# 1.0.0-beta.1 (2017-01-13)

- Deploying the `skyuxconfig.json` and `package.json` files.

# 1.0.0-beta.0 (2017-01-05)

- Initial release to NPM.