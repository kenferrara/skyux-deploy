/*jshint jasmine: true, node: true */
'use strict';

describe('skyux-deploy lib assets', () => {

  const fs = require('fs');
  const path = require('path');
  const proxyquire = require('proxyquire').noCallThru();
  // const logger = require('winston');

  it('should expose a getDistAssets method', () => {
    const lib = require('../lib/assets');
    expect(lib.getDistAssets).toBeDefined();
  });

  it('should expose a getEmittedAssets method', () => {
    const lib = require('../lib/assets');
    expect(lib.getEmittedAssets).toBeDefined();
  });

  it('should expose a getHash method', () => {
    const lib = require('../lib/assets');
    expect(lib.getHash).toBeDefined();
  });

  describe('getDistAssets', () => {

    it('should return an empty array if no metadata.json', () => {
      const lib = require('../lib/assets');
      expect(lib.getDistAssets()).toEqual([]);
    });

    it('should return the name and sri hash for each assets in metadata', () => {
      const readFileSync = fs.readFileSync;
      spyOn(fs, 'existsSync').and.returnValue(true);
      spyOn(fs, 'readFileSync').and.callFake((file, options) => {
        if (file.indexOf('custom-name.js') > -1) {
          return 'my-custom-content1';
        } else {
          return readFileSync(file, options);
        }
      });

      let stubs = {};
      stubs[path.join(process.cwd(), 'dist', 'metadata.json')] = [
        {
          name: 'custom-name.js'
        }
      ];

      const lib = proxyquire('../lib/assets', stubs);
      const assets = lib.getDistAssets();
      const sri = lib.getHash('my-custom-content1', 'sha384', 'base64');

      expect(assets[0].name).toContain('custom-name');
      expect(assets[0].sri).toEqual('sha384-' + sri);
    });

    it('should include content if argument supplied', () => {
      const readFileSync = fs.readFileSync;
      spyOn(fs, 'existsSync').and.returnValue(true);
      spyOn(fs, 'readFileSync').and.callFake((file, options) => {
        if (file.indexOf('custom-name.js') > -1) {
          return 'my-custom-content2';
        } else {
          return readFileSync(file, options);
        }
      });

      let stubs = {};
      stubs[path.join(process.cwd(), 'dist', 'metadata.json')] = [
        {
          name: 'custom-name.js'
        }
      ];

      const lib = proxyquire('../lib/assets', stubs);
      const assets = lib.getDistAssets(true);

      expect(assets[0].content).toEqual('my-custom-content2');
    });

    it('should not include content if argument supplied', () => {
      const readFileSync = fs.readFileSync;
      spyOn(fs, 'existsSync').and.returnValue(true);
      spyOn(fs, 'readFileSync').and.callFake((file, options) => {
        if (file.indexOf('custom-name.js') > -1) {
          return 'my-custom-content3';
        } else {
          return readFileSync(file, options);
        }
      });

      let stubs = {};
      stubs[path.join(process.cwd(), 'dist', 'metadata.json')] = [
        {
          name: 'custom-name.js'
        }
      ];

      const lib = proxyquire('../lib/assets', stubs);
      const assetsWithContent = lib.getDistAssets(true);
      const assetsWithoutContent = lib.getDistAssets(false);

      expect(assetsWithContent[0].content).toEqual('my-custom-content3');
      expect(assetsWithoutContent[0].content).not.toBeDefined();
    });

  });

  describe('getEmittedAssets', () => {

    it('should return an empty array if no assets folder', () => {
      const lib = require('../lib/assets');
      expect(lib.getEmittedAssets()).toEqual([]);
    });

    it('should return an empty array if empty assets folder', () => {
      spyOn(fs, 'existsSync').and.returnValue(true);
      spyOn(fs, 'readdirSync').and.returnValue([]);
      const lib = require('../lib/assets');
      expect(lib.getEmittedAssets()).toEqual([]);
    });

    it('should return an array of names/files from the assets folder', () => {
      spyOn(fs, 'existsSync').and.returnValue(true);
      spyOn(fs, 'readdirSync').and.returnValue([
        'full-path/my-file.jpg'
      ]);
      spyOn(path, 'parse').and.returnValue({
        base: 'my-file.jpg'
      });
      const lib = require('../lib/assets');
      expect(lib.getEmittedAssets()).toEqual([
        {
          name: 'my-file.jpg',
          file: 'full-path/my-file.jpg'
        }
      ]);
    });
  });

});
