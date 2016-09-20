/*jshint node: true*/
'use strict';

const fs = require('fs');
const merge = require('merge');
const path = require('path');
const logger = require('winston');

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
    return require(skyuxPath)._requested.spec;
  }

  logger.error('Unable to locate an installation of SKYUX2.');
  return '';
};

/**
 * Returns the settings.
 * @name getSettings
 * @returns {Object} settings
 */
const getSettings = (argv) => {
  const cwd = process.cwd();
  const jsonPath = path.join(cwd, 'package.json');
  const defaults = {
    name: '',
    version: '',
    skyuxVersion: getSkyuxVersion(cwd),
    azureStorageTableName: 'spa'
  };
  let json = {};

  if (fs.existsSync(jsonPath)) {
    json = require(jsonPath);
  }

  return merge(defaults, json, argv);
};

module.exports = {
  getSettings: getSettings
};
