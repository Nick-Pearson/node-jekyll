'use strict';

const assert = require('assert');

const frontMatter = require('../src/frontMatter.js');

describe('frontMatter', function()
{
  describe('#frontMatter(contents)', function()
  {
    it('returns null for empty string', function()
    {
      const a = frontMatter.frontMatter('');
      assert.equal(a.frontmatter, null);
      assert.equal(a.remaining, '');
    });

    it('returns null for string with no front matter', function()
    {
      const a = frontMatter.frontMatter('<html><head><title>I do some stuff</title></head><body><h1>Nothing here</h1></body></html>');
      assert.equal(a.frontmatter, null);
      assert.equal(a.remaining, '<html><head><title>I do some stuff</title></head><body><h1>Nothing here</h1></body></html>');
    });

    it('returns front matter with layout if layout specfied', function()
    {
      const a = frontMatter.frontMatter('---\nlayout: mylayout\n---\n<html><head><title>Hello world</head><body><p>hi there</p></body></html>');
      assert.deepEqual(a.frontmatter, {layout: 'mylayout'});
      assert.equal(a.remaining, '<html><head><title>Hello world</head><body><p>hi there</p></body></html>');
    });

    it('returns frontmatter with published if speficied', function()
    {
      const a = frontMatter.frontMatter('---\npublished: false\n---\n<html><head><title>Hello world</head><body><p>hi there</p></body></html>');
      assert.deepEqual(a.frontmatter, {published: false});
      assert.equal(a.remaining, '<html><head><title>Hello world</head><body><p>hi there</p></body></html>');
    });

    it('returns frontmatter with custom variables if speficied', function()
    {
      const a = frontMatter.frontMatter('---\nfood: Pizza\n---\n<html><head><title>Hello world</head><body><p>hi there</p></body></html>');
      assert.deepEqual(a.frontmatter, {food: 'Pizza'});
      assert.equal(a.remaining, '<html><head><title>Hello world</head><body><p>hi there</p></body></html>');
    });

    it('skips any additional whitespace', function()
    {
      const a = frontMatter.frontMatter('---\n\t   food    : Pizza\n\n\n---\n<html><head><title>Hello world</head><body><p>hi there</p></body></html>');
      assert.deepEqual(a.frontmatter, {food: 'Pizza'});
      assert.equal(a.remaining, '<html><head><title>Hello world</head><body><p>hi there</p></body></html>');
    });

    it('ignores any additional frontmatter sections', function()
    {
      const a = frontMatter.frontMatter('---\nfood: Pizza\n---\n<html><head><title>Hello world</head><body>\n---\ndrink: Cola\n---\n<p>hi there</p></body></html>');
      assert.deepEqual(a.frontmatter, {food: 'Pizza'});
      assert.equal(a.remaining, '<html><head><title>Hello world</head><body>\n---\ndrink: Cola\n---\n<p>hi there</p></body></html>');
    });

    it('ignores frontmatter later in file', function()
    {
      const a = frontMatter.frontMatter('<html><head><title>I do some stuff</title></head><body>\n---\nfood: Pizza\n---\n<h1>Nothing here</h1></body></html>');
      assert.equal(a.frontmatter, null);
      assert.equal(a.remaining, '<html><head><title>I do some stuff</title></head><body>\n---\nfood: Pizza\n---\n<h1>Nothing here</h1></body></html>');
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
