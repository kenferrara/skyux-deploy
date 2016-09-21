/*jshint node: true*/
'use strict';
const logger = require('winston');

const assets = require('./assets');
const azure = require('./azure');
const utils = require('./utils');

module.exports = (settings) => {
  const assetsSorted = assets.getDistAssetsSorted();
  const tableAssets = assetsSorted.map((asset) => asset.hashedName);
  const entity = {
    PartitionKey: azure.generator.String(settings.name),
    RowKey: azure.generator.String(settings.version.toString()),
    Scripts: azure.generator.String(JSON.stringify(tableAssets)),
    SkyUXVersion: azure.generator.String(settings.skyuxVersion),
    Version: azure.generator.String(settings.version)
  };

  azure.registerAssetsToBlob(settings, assetsSorted).then(() => {
    azure.registerEntityToTable(settings, entity).then(() => {
      logger.info('Successfully registered.');
    }, utils.handleError);
  }, utils.handleError);
};
