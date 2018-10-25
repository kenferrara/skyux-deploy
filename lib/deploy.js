/*jshint node: true*/
'use strict';
const logger = require('@blackbaud/skyux-logger');

const assets = require('./assets');
const azure = require('./azure');

module.exports = (settings) => {
  const assetsWithContent = assets.getDistAssets(
    true,
    settings.isStaticClient,
    settings.version
  );
  const assetsWithoutContent = assets.getDistAssets(
    false,
    settings.isStaticClient,
    settings.version
  );
  const assetsEmitted = assets.getEmittedAssets();
  const assetsCombined = assetsWithContent.concat(assetsEmitted);

  const entity = {
    PartitionKey: azure.generator.String(settings.name),
    RowKey: azure.generator.String(settings.version),
    Scripts: azure.generator.String(JSON.stringify(assetsWithoutContent)),
    SkyUXVersion: azure.generator.String(settings.skyuxVersion),
    PackageConfig: azure.generator.String(JSON.stringify(settings.packageConfig)),
    SkyUXConfig: azure.generator.String(JSON.stringify(settings.skyuxConfig))
  };

  return new Promise((resolve, reject) => {

    if (assetsCombined.length) {
      azure.registerAssetsToBlob(settings, assetsCombined)
        .then(() => azure.registerEntityToTable(settings, entity))
        .then(() => {
          logger.info('Successfully registered.');
          resolve();
        })
        .catch(err => {
          logger.error(err);
          reject(err);
        });
    } else {
      reject('Unable to locate any assets to deploy.');
    }

  });
};
