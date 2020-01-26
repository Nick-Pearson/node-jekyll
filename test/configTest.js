'use strict';

const assert = require('assert');
const path = require('path');

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

  describe('#isFileExcluded(file)', function()
  {
    it('false for file not in exclude list ', function()
    {
      const cfg = new Config();
      assert.strictEqual(false, cfg.isFileExcluded('/blog/index.html'));
    });

    it('true for file in exclude list ', function()
    {
      const cfg = new Config('exclude: [/blog/index.html]');
      assert.strictEqual(true, cfg.isFileExcluded('/blog/index.html'));
    });

    it('true for file that starts with underscore', function()
    {
      const cfg = new Config();
      assert.strictEqual(true, cfg.isFileExcluded('/blog/_index.html'));
    });

    it('true for file in directory that starts with underscore', function()
    {
      const cfg = new Config();
      assert.strictEqual(true, cfg.isFileExcluded('/blog/_post/index.html'));
    });
  });

  describe('#getSourceDir', function()
  {
    it('current working directory if source not specified', function()
    {
      const cfg = new Config();
      assert.strictEqual(path.normalize(process.cwd()), cfg.getSourceDir());
    });

    it('subdirectory if specified', function()
    {
      const cfg = new Config('source: ./subdir');
      assert.strictEqual(path.normalize(process.cwd() + '/subdir'), cfg.getSourceDir());
    });
  });

  describe('#getBuildDir', function()
  {
    it('_site directory if source not specified', function()
    {
      const cfg = new Config();
      assert.strictEqual(path.normalize(process.cwd() + '/_site'), cfg.getBuildDir());
    });

    it('subdirectory if specified', function()
    {
      const cfg = new Config('destination: ./_other');
      assert.strictEqual(path.normalize(process.cwd() + '/_other'), cfg.getBuildDir());
    });
  });
});
