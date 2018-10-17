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
 * @param {boolean} isStaticClient
 * @returns {Array} assets
 */
const getDistAssets = (includeContent, isStaticClient) => {
  let metadataPath = path.join(dist, 'metadata.json');

  if (isStaticClient) {
    return glob.sync(path.join(dist, 'bundles', '*.js'))
      .map(bundle => {
        const bundlePath = bundle.split('/');
        return formatAssets(
          includeContent,
          isStaticClient,
          { name: bundlePath[bundlePath.length - 1] }
        );
      });
  }

  if (fs.existsSync(metadataPath)) {
    const metadata = require(metadataPath);
    return metadata.map((asset) =>
      formatAssets(includeContent, isStaticClient, asset));
  }

  return [];
};

/**
 * Formats individual assets
 * @name formatAssets
 * @param {boolean} includeContent
 * @param {boolean} isStaticContent
 * @param {object} asset
 * @returns {object} asset
 */
const formatAssets = (includeContent, isStaticContent, asset) => {
  const parsed = path.parse(asset.name);

  let content;
  if (isStaticContent) {
    content = fs.readFileSync(
      path.join(dist, 'bundles', asset.name),
      readOptions);
  } else {
    content = fs.readFileSync(
      path.join(dist, asset.name),
      readOptions);
  }

  const hash = getHash(content, 'md5', 'hex');

  let newProperties = {
    name: parsed.name + '.' + hash + parsed.ext,
    sri: sriAlgorithm + '-' + getHash(content, sriAlgorithm, 'base64')
  };

  if (includeContent) {
    newProperties.content = content;
  }

  return merge({}, asset, newProperties);
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
