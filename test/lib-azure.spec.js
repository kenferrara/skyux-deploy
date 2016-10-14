/*jshint jasmine: true, node: true */
'use strict';

describe('sky-pages-deploy lib azure', () => {

  const mock = require('mock-require');
  const azure = require('azure-storage');

  let lib;
  let createBlobServiceArgs;
  let createTableServiceArgs;

  beforeEach(() => {

    createBlobServiceArgs = {};
    createTableServiceArgs = {};

    mock('azure-storage', {
      createBlobService: (account, key) => {
        createBlobServiceArgs = {
          account: account,
          key: key
        };
      },

      createBlockBlobFromText: () => {},

      createTableService: (account, key) => {
        createTableServiceArgs = {
          account: account,
          key: key
        };
      },

      TableUtilities: {
        entityGenerator: {
          String: () => {}
        }
      }
    });

    lib = require('../lib/azure');
  });

  afterEach(() => {
    mock.stop('azure-storage');
  });

  it('should expose the azure TableUtilities generator', () => {
    expect(lib.generator).toBeDefined();
  });

  it('should expose a registerAssetsToBlob method', () => {
    expect(lib.registerAssetsToBlob).toBeDefined();
  });

  it('should expose a registerEntityToTable metho', () => {
    expect(lib.registerEntityToTable).toBeDefined();
  });

  describe('registerAssetsToBlob', () => {
    it('should create a blob service using the supplied credentials', () => {
      lib.registerAssetsToBlob({
        azureStorageAccount: 'account1',
        azureStorageAccessKey: 'key1'
      });
      expect(createBlobServiceArgs.account).toEqual('account1');
      expect(createBlobServiceArgs.key).toEqual('key1');
    });
  });

  describe('registerEntityToTable', () => {
    it('should create a table service using the supplied credentials', () => {
      lib.registerEntityToTable({
        azureStorageAccount: 'account2',
        azureStorageAccessKey: 'key2'
      });
      expect(createTableServiceArgs.account).toEqual('account2');
      expect(createTableServiceArgs.key).toEqual('key2');
    });
  });
});
