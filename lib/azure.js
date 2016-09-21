/*jshint node: true*/
'use strict';

const azure = require('azure-storage');
const logger = require('winston');
const utils = require('./utils');

/**
 * For each asset, register it to blob storage.
 * @name registerAssetsToBlob
 * @param {Array} assets
 * @param {Object} settings
 * @returns {Function} promise
 */
const registerAssetsToBlob = (settings, assets) => {
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
        utils.rejectIfError(reject, error);
        resolve();
      }
    );
  });

  return new Promise((fnResolve, fnReject) => {
    logger.info('Verifying container %s', settings.name);
    blob.createContainerIfNotExists(settings.name, acl, (error) => {
      utils.rejectIfError(fnReject, error);
      Promise.all(assets.map(insert)).then(() => {
        logger.info('SPA %s registered in blob storage.', settings.name);
        fnResolve();
      }, fnReject);
    });
  });
};

/**
 * Inserts or replaces an entity in Table Storage.
 * @name insertOrReplaceEntity
 * @param {Object} settings
 * @param {Entity} entity
 * @returns {Function} promise
 */
const registerAssetsToTable = (settings, entity) => {
  const table = azure.createTableService(
    settings.azureStorageAccount,
    settings.azureStorageAccessKey
  );

  return new Promise((resolve, reject) => {
    logger.info('Verifying table %s', settings.azureStorageTableName);
    table.createTableIfNotExists(settings.azureStorageTableName, (errorTable) => {
      utils.rejectIfError(reject, errorTable);
      table.insertEntity(settings.azureStorageTableName, entity, (errorEntity) => {
        utils.rejectIfError(reject, errorEntity);
        logger.info('SPA %s registered in table storage.', settings.name);
        resolve();
      });
    });
  });
};

module.exports = {
  generator: azure.TableUtilities.entityGenerator,
  registerAssetsToBlob: registerAssetsToBlob,
  registerAssetsToTable: registerAssetsToTable
};
