/*jshint node: true*/
'use strict';

const crypto = require('crypto');
const fs = require('fs-extra');
const merge = require('merge');
const path = require('path');
const glob = require('glob');

const cwd = process.cwd();
const dist = path.join(cwd, 'dist');
const assets = path.join(dist, 'assets');
const sriAlgorithm = 'sha384';
const readOptions = { encoding: 'utf8' };

/**
 * Returns an array of emitted assets (images).
 * @name getEmittedAssets
 * @returns {Array} assets
 */
const getEmittedAssets = () => glob
  .sync(path.join(assets, '**', '*.*'))
  .map(asset => ({
    name: asset.substring(dist.length + 1),
    file: asset
  }));

/**
 * Returns an array of assets (files + metadata).
 * @name getDistAssets
 * @param {boolean} includeContent
 * @returns {Array} assets
 */
const getDistAssets = (includeContent) => {
  const metadataPath = path.join(dist, 'metadata.json');

  if (fs.existsSync(metadataPath)) {
    const metadata = require(metadataPath);

    return metadata.map((asset) => {
      const parsed = path.parse(asset.name);
      const content = fs.readFileSync(path.join(dist, asset.name), readOptions);
      const hash = getHash(content, 'md5', 'hex');

      let newProperties = {
        name: parsed.name + '.' + hash + parsed.ext,
        sri: sriAlgorithm + '-' + getHash(content, sriAlgorithm, 'base64')
      };

      if (includeContent) {
        newProperties.content = content;
      }

      return merge({}, asset, newProperties);
    });
  }

  return [];
};

/**
 * Light wrapper to crypto.createHash.
 * @name getHash
 * @param {string} content
 * @param {string} algorithm
 * @param {string} output
 * @returns {string} hash
 */
const getHash = (content, algorithm, output) =>
  crypto.createHash(algorithm).update(content, 'utf8').digest(output);

module.exports = {
  getDistAssets: getDistAssets,
  getEmittedAssets: getEmittedAssets,
  getHash: getHash
};
