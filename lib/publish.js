/*jshint node: true*/
'use strict';

const azure = require('./azure');

module.exports = (settings) => {
  const entity = {
    PartitionKey: azure.generator.String(settings.name),
    RowKey: azure.generator.String('__default'),
    Version: azure.generator.String(settings.version)
  };
  azure.registerAssetsToTable(settings, entity);
};
