'use strict';

const assert = require('assert');

const Config = require('../src/config.js');

describe('config', function()
{
  describe('#Config(configString)', function()
  {
    it('returns default config if no parameter', function()
    {
      const cfg = new Config();
      assert.notEqual(cfg, null);
      assert.deepEqual(cfg.data, {});
    });

    it('returns config with yaml data if yaml string parameter', function()
    {
      const cfg = new Config('exclude: [myfile]');
      assert.notEqual(cfg, null);
      assert.deepEqual(cfg.data, {exclude: ['myfile']});
    });

    it('throws on invalid yaml string parameter', function()
    {
      try
      {
        new Config('*:');
        assert.fail();
      }
      catch (e)
      {
        assert.deepEqual(e.name, 'YAMLException');
      }
    });
  });
});
