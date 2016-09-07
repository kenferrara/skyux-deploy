/*jshint node: true*/
'use strict';

const azure = require('azure-storage');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const merge = require('merge');
const logger = require('winston');

/**
 * Returns an array of assets (files + metadata).
 * @name getDistAssets
 * @param {string} dist
 * @returns {Array} assets
 */
const getDistAssets = (dist) =>
  glob.sync(dist + '/*.js').map((file) => {
    const parsed = path.parse(file);
    return merge(parsed, {
      fullpath: file,
      hashedName: parsed.name + parsed.ext
    });
  });

/**
 * Sorts the assets.
 * This should arguably come from metadata.
 * @name sortDistAssets
 * @param {string} dist
 * @returns {Array} assets
 */
const getDistAssetsSorted = (dist) => {
  const sortOrder = ['polyfill', 'vendor', 'app'];
  const assets = getDistAssets(dist);
  return assets.sort((a, b) => {
    const aName = a.name.split('.')[0];
    const bName = b.name.split('.')[0];
    return sortOrder.indexOf(aName) - sortOrder.indexOf(bName);
  });
};

/**
 * Calls the reject method with the specific error.
 * @name rejectIfError
 * @param {Function} reject
 * @param {string} [error]
 * @returns null;
 */
const rejectIfError = (reject, error) => {
  if (error) {
    logger.error(error);
    reject(error);
  }
};

/**
 * For each asset, register it to blob storage.
 * @name registerAssetsToBlob
 * @param {Array} assets
 * @name {string} name
 * @returns {Function} promise
 */
const registerAssetsToBlob = (assets, name) => {
  const blob = azure.createBlobService();
  const acl = { publicAccessLevel: 'blob' };
  const insert = (asset) => new Promise((resolve, reject) => {
    logger.info('Creating blob for %s', asset.name);

    const content = fs.readFileSync(asset.fullpath, { encoding: 'utf8' });
    blob.createBlockBlobFromText(name, asset.hashedName, content, (error) => {
      rejectIfError(reject, error);
      resolve();
    });
  });

  return new Promise((fnResolve, fnReject) => {
    logger.info('Verifying container %s', name);
    blob.createContainerIfNotExists(name, acl, (error) => {
      rejectIfError(fnReject, error);
      Promise.all(assets.map(insert)).then(fnResolve, fnReject);
    });
  });
};

/**
 * For each asset, register it to table storage.
 * @name registerAssetsToTable
 * @param {Array} assets
 * @name {string} spaName
 * @name {string} spaVersion
 * @name {string} skyuxVersion
 * @returns {Function} promise
 */
const registerAssetsToTable = (assets, spaName, spaVersion, skyuxVersion) => {
  const tableName = 'spa';
  const table = azure.createTableService();
  const generator = azure.TableUtilities.entityGenerator;
  const tableAssets = assets.map((asset) => asset.name + asset.ext);
  const entity = {
    PartitionKey: generator.String(spaName),
    RowKey: generator.String(spaVersion),
    Scripts: generator.String(JSON.stringify(tableAssets)),
    SkyUXVersion: generator.String(skyuxVersion),
    Version: generator.String(spaVersion)
  };

  return new Promise((resolve, reject) => {
    logger.info('Verifying table %s', tableName);
    table.createTableIfNotExists(tableName, (errorTable) => {
      rejectIfError(reject, errorTable);
      table.insertEntity(tableName, entity, (errorEntity) => {

        // Catch the common "already exists" error
        if (errorEntity && errorEntity.toString().indexOf('already exists') > -1) {
          logger.error(
            '%s, version %s has already been registered in table storage.',
            spaName,
            spaVersion
          );
          return;
        }

        rejectIfError(reject, errorEntity);
        resolve();
      });
    });
  });
};

/**
 * Reads the installed version of skyux2.
 * @name getSkyuxVersion
 * @returns {string} skyuxVersion
 */
const getSkyuxVersion = () => {
  const skyuxPath = path.resolve(
    process.cwd(),
    'node_modules',
    'blackbaud-skyux2',
    'package.json'
  );
  if (fs.existsSync(skyuxPath)) {
    const skyuxJson = require(skyuxPath);
    return skyuxJson._requested.spec;
  } else {
    logger.error('Unable to locate an installation of SKYUX2.');
  }
};

/**
 * Allows errors to be recorded via one-line.
 * @name handleError
 * @param [Error] {error}
 */
const handleError = (error) => {
  if (error) {
    logger.error(error);
  }
};

/**
 * Verifies version + assets, then adds to blob + table storage.
 * @name deploy
 * @param {string} dist
 * @returns null
 */
const deploy = () => {
  const spaJson = require(path.join(process.cwd(), 'package.json'));
  const spaVersion = spaJson.version;
  const spaName = spaJson.name;

  const skyuxVersion = getSkyuxVersion();
  const assets = getDistAssetsSorted('dist');

  if (assets.length === 0) {
    logger.error('Unable to find any matching assets in SPA %s.', spaName);
    return;
  }

  logger.info('Registering SPA %s - %s', spaName, spaVersion);
  logger.info('spaVersion: %s', spaVersion);
  logger.info('spaName: %s', spaName);
  logger.info('skyuxVersion: %s', skyuxVersion);
  registerAssetsToBlob(assets, spaName).then(() => {
    logger.info('SPA %s successfully registered in blob storage.', spaName);
    registerAssetsToTable(assets, spaName, spaVersion, skyuxVersion).then(() => {
      logger.info('SPA %s successfully registered in table storage.', spaName);
    }, handleError);
  }, handleError);
};

// ENTRY POINT
deploy();
// ENTRY POINT
