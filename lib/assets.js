/*jshint node: true*/
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const glob = require('glob');
const merge = require('merge');
const path = require('path');

const dist = path.join(process.cwd(), 'dist');
const sriAlgorithm = 'sha384';

/**
 * Returns an array of assets (files + metadata).
 * @name getDistAssets
 * @param {string} dist
 * @returns {Array} assets
 */
const getDistAssets = () =>
  glob.sync(dist + '/*.js').map((file) => {
    const parsed = path.parse(file);
    const content = fs.readFileSync(file, { encoding: 'utf8' });
    const hash = getHash(content, 'md5', 'hex');

    return merge(parsed, {
      content: content,
      hashedName: parsed.name + '.' + hash + parsed.ext,
      sri: sriAlgorithm + '-' + getHash(content, sriAlgorithm, 'base64')
    });
  });

/**
 * Sorts the assets.
 * This should arguably come from metadata.
 * @name sortDistAssets
 * @param {string} dist
 * @returns {Array} assets
 */
const getDistAssetsSorted = () => {
  const sortOrder = ['polyfill', 'vendor', 'skyux', 'app'];
  const assets = getDistAssets(dist);
  return assets.sort((a, b) => {
    const aName = a.name.split('.')[0];
    const bName = b.name.split('.')[0];
    return sortOrder.indexOf(aName) - sortOrder.indexOf(bName);
  });
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
  getDistAssetsSorted: getDistAssetsSorted,
  getHash: getHash
};
