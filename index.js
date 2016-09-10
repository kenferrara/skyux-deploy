/*jshint node: true*/
'use strict';

const azure = require('azure-storage');
const crypto = require('crypto');
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
    const content = fs.readFileSync(file, { encoding: 'utf8' });
    const hash = getHash(content, 'md5', 'hex');
    return merge(parsed, {
      content: content,
      hashedName: parsed.name + '.' + hash + parsed.ext,
    });
  });

/**
 * Light wrapper to crypto.createHash.
 * @name getHash
 * @param {string} content
 * @param {string} algorithm
 * @param {string} output
 * @returns {string} hash
 */
const getHash = (content, algorithm, output) =>
  crypto.createHash(algorithm).update(content).digest(output);

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
 * @param {Object} settings
 * @returns {Function} promise
 */
const registerAssetsToBlob = (assets, settings) => {
  const blob = azure.createBlobService(
    settings.azureStorageAccount,
    settings.azureStorageAccessKey
  );
  const acl = { publicAccessLevel: 'blob' };
  const insert = (asset) => new Promise((resolve, reject) => {
    logger.info('Creating blob for %s', asset.name);

    const options = {
      contentSettings: {
        contentType: 'application/x-javascript'
      }
    };

    blob.createBlockBlobFromText(
      settings.name,
      asset.hashedName,
      asset.content,
      options,
      (error) => {
        rejectIfError(reject, error);
        resolve();
      }
    );
  });

  return new Promise((fnResolve, fnReject) => {
    logger.info('Verifying container %s', settings.name);
    blob.createContainerIfNotExists(settings.name, acl, (error) => {
      rejectIfError(fnReject, error);
      Promise.all(assets.map(insert)).then(() => {
        logger.info('SPA %s registered in blob storage.', settings.name);
        fnResolve();
      }, fnReject);
    });
  });
};

/**
 * For each asset, register it to table storage.
 * @name registerAssetsToTable
 * @param {Array} assets
 * @param {Object} settings
 * @returns {Function} promise
 */
const registerAssetsToTable = (assets, settings) => {
  const table = azure.createTableService(
    settings.azureStorageAccount,
    settings.azureStorageAccessKey
  );
  const generator = azure.TableUtilities.entityGenerator;
  const tableAssets = assets.map((asset) => asset.hashedName);
  const entity = {
    PartitionKey: generator.String(settings.name),
    RowKey: generator.String(settings.version),
    Scripts: generator.String(JSON.stringify(tableAssets)),
    SkyUXVersion: generator.String(settings.skyuxVersion),
    Version: generator.String(settings.version)
  };

  return new Promise((resolve, reject) => {
    logger.info('Verifying table %s', settings.azureStorageTableName);
    table.createTableIfNotExists(settings.azureStorageTableName, (errorTable) => {
      rejectIfError(reject, errorTable);
      table.insertEntity(settings.azureStorageTableName, entity, (errorEntity) => {
        rejectIfError(reject, errorEntity);
        logger.info('SPA %s registered in table storage.', settings.name);
        resolve();
      });
    });
  });
};

/**
 * Reads the installed version of skyux2.
 * @name getSkyuxVersion
 * @param {String} cwd
 * @returns {string} skyuxVersion
 */
const getSkyuxVersion = (cwd) => {
  const skyuxPath = path.resolve(
    cwd,
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
 * Handles the most-common
 * @name handleError
 * @param [Error] {error}
 */
const handleError = (error) => {
  if (error) {
    if (error.toString().indexOf('already exists') > -1) {
      logger.error('Already been registered in table storage.');
    } else {
      logger.error(error);
    }
  }
};

/**
 * Validates any required settings.
 * @name validate
 * @param {Array} assets
 * @param {Object} settings
 * @returns {Boolean} isValid
 */
const validate = (assets, settings) => {
  const required = [
    'name',
    'version',
    'skyuxVersion',
    'azureStorageAccount',
    'azureStorageAccessKey',
    'azureStorageTableName'
  ];
  let success = true;

  if (assets.length === 0) {
    logger.error('Unable to find any matching assets in SPA %s.', settings.name);
    success = false;
  }

  required.forEach((key) => {
    if (!settings[key]) {
      logger.error('%s is required.', key);
      success = false;
    }
  });

  return success;
};

/**
 * Verifies version + assets, then adds to blob + table storage.
 * @name processArgs
 * @param {Object} args
 * @returns null
 */
const processArgv = (argv) => {
  const cwd = process.cwd();
  const json = require(path.join(cwd, 'package.json'));

  const assets = getDistAssetsSorted(path.join(cwd, 'dist'));
  const settings = merge({
    version: json.version,
    name: '',
    skyuxVersion: getSkyuxVersion(cwd),
    azureStorageTableName: 'spa'
  }, argv);

  if (!validate(assets, settings)) {
    return;
  }

  logger.info('SPA Name: %s', settings.name);
  logger.info('SPA Version: %s', settings.version);
  logger.info('SKYUX Version: %s', settings.skyuxVersion);

  registerAssetsToBlob(assets, settings).then(() => {
    registerAssetsToTable(assets, settings).then(() => {}, handleError);
  }, handleError);
};

module.exports = processArgv;
