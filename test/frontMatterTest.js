'use strict';

const assert = require('assert');

const frontMatter = require('../src/frontMatter.js');

describe('frontMatter', function()
{
  describe('#frontMatter(contents)', function()
  {
    it('returns null for empty string', function()
    {
      const fm = frontMatter.frontMatter('');
      assert.equal(fm, null);
    });

    it('returns null for string with no front matter', function()
    {
      const fm = frontMatter.frontMatter('<html><head><title>I do some stuff</title></head><body><h1>Nothing here</h1></body></html>');
      assert.equal(fm, null);
    });

    it('returns front matter with layout if layout specfied', function()
    {
      const fm = frontMatter.frontMatter('---\nlayout: mylayout\n---\n<html><head><title>Hello world</head><body><p>hi there</p></body></html>');
      assert.deepEqual(fm, {layout: 'mylayout'});
    });

    it('returns frontmatter with published if speficied', function()
    {
      const fm = frontMatter.frontMatter('---\npublished: false\n---\n<html><head><title>Hello world</head><body><p>hi there</p></body></html>');
      assert.deepEqual(fm, {published: false});
    });

    it('returns frontmatter with custom variables if speficied', function()
    {
      const fm = frontMatter.frontMatter('---\nfood: Pizza\n---\n<html><head><title>Hello world</head><body><p>hi there</p></body></html>');
      assert.deepEqual(fm, {food: 'Pizza'});
    });

    it('skips any additional whitespace', function()
    {
      const fm = frontMatter.frontMatter('---\n\t   food    : Pizza\n\n\n---\n<html><head><title>Hello world</head><body><p>hi there</p></body></html>');
      assert.deepEqual(fm, {food: 'Pizza'});
    });

    it('ignores any additional frontmatter sections', function()
    {
      const fm = frontMatter.frontMatter('---\nfood: Pizza\n---\n<html><head><title>Hello world</head><body>\n---\ndrink: Cola\n---\n<p>hi there</p></body></html>');
      assert.deepEqual(fm, {food: 'Pizza'});
    });

    it('ignores frontmatter later in file', function()
    {
      const fm = frontMatter.frontMatter('<html><head><title>I do some stuff</title></head><body>\n---\nfood: Pizza\n---\n<h1>Nothing here</h1></body></html>');
      assert.equal(fm, null);
    });

    it('throws exception if no end frontmatter tag', function()
    {
      try
      {
        frontMatter.frontMatter('---\nfood: Pizza\n<html><head><title>I do some stuff</title></head><body><h1>Nothing here</h1></body></html>');
        assert.fail();
      }
      catch (e)
      {
        assert.deepEqual(e.message, 'Failed to find end of frontmatter');
      }
    });

    it('throws exception if yaml is invalid', function()
    {
      try
      {
        frontMatter.frontMatter('---\n*: \n---\n<html><head><title>I do some stuff</title></head><body><h1>Nothing here</h1></body></html>');
        assert.fail();
      }
      catch (e)
      {
        assert.deepEqual(e.name, 'YAMLException');
      }
    });
  });
});
