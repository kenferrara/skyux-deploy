/*jshint node: true*/
'use strict';
const logger = require('winston');

const assets = require('./assets');
const azure = require('./azure');
const utils = require('./utils');

module.exports = (settings) => {
  const assetsWithContent = assets.getDistAssets(true);
  const assetsWithoutContent = assets.getDistAssets(false);

  const entity = {
    PartitionKey: azure.generator.String(settings.name),
    RowKey: azure.generator.String(settings.version),
    Scripts: azure.generator.String(JSON.stringify(assetsWithoutContent)),
    SkyUXVersion: azure.generator.String(settings.skyuxVersion),
  };

  return azure.registerAssetsToBlob(settings, assetsWithContent).then(() => {
    azure.registerEntityToTable(settings, entity).then(() => {
      logger.info('Successfully registered.');
    }, utils.handleError);
  }, utils.handleError);
};
