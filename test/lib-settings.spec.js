/*jshint jasmine: true, node: true */
'use strict';

describe('skyux-deploy lib settings', () => {

  const fs = require('fs');
  const path = require('path');
  const proxyquire = require('proxyquire');
  const logger = require('winston');

  it('should expose a getSettings method', () => {
    expect(require('../lib/settings').getSettings).toBeDefined();
  });

  it('should return settings, merging package.json with arguments', () => {

    spyOn(fs, 'existsSync').and.returnValue(true);
    spyOn(fs, 'readFileSync').and.callFake((filename) => {
      if (filename.indexOf('package.json') > -1) {
        return JSON.stringify({
          version: 'custom-version',
          test1: 'value1'
        });
      }

      if (filename.indexOf('skyuxconfig.json') > -1) {
        return JSON.stringify({
          test2: 'value2'
        });
      }

      return '';
    });

    const lib = require('../lib/settings');
    const settings = lib.getSettings({
      name: 'custom-name1'
    });

    expect(settings.name).toEqual('custom-name1');
    expect(settings.version).toEqual('custom-version');
    expect(settings.packageConfig.test1).toEqual('value1');
    expect(settings.skyuxConfig.test2).toEqual('value2');
  });

  it('should return settings even if package.json does not exist', () => {

    spyOn(logger, 'error');
    spyOn(fs, 'existsSync').and.returnValue(false);

    const lib = require('../lib/settings');
    const settings = lib.getSettings({
      name: 'custom-name2'
    });

    expect(settings.name).toEqual('custom-name2');
    expect(settings.version).toEqual('');
    expect(logger.error).toHaveBeenCalledWith(
      'Unable to locate an installation of SKYUX2.'
    );
  });

  it('should read the skyux version if it is installed', () => {

    const skyuxInstalledPath = path.join(
      process.cwd(),
      'node_modules',
      '@blackbaud',
      'skyux',
      'package.json'
    );

    spyOn(logger, 'error');
    spyOn(fs, 'existsSync').and.returnValue(true);
    spyOn(fs, 'readFileSync').and.callFake((filename) => {
      if (filename === skyuxInstalledPath) {
        return JSON.stringify({
          _requested: {
            spec: 'custom-skyux-version'
          }
        });
      }

      return '{}';
    });

    const lib = require('../lib/settings');
    const settings = lib.getSettings();

    expect(settings.skyuxVersion).toEqual('custom-skyux-version');
    expect(logger.error).not.toHaveBeenCalled();
  });

});
