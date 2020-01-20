'use strict';

const assert = require('assert');

const pathHelpers = require('../src/pathHelpers.js');

describe('pathHelpers', function()
{
  describe('#getFileExtension(filepath)', function()
  {
    it('returns extension when present', function()
    {
      const extension = pathHelpers.getFileExtension('C:\\my\\path\\to\\file that\\exists\\document.docx');
      assert.equal(extension, 'docx');
    });

    it('returns last extension if multple are present', function()
    {
      const extension = pathHelpers.getFileExtension('C:\\my\\path\\to\\file that\\exists\\document.ignored.pdf');
      assert.equal(extension, 'pdf');
    });

    it('returns null if no extension is present', function()
    {
      const extension = pathHelpers.getFileExtension('C:\\my\\path\\to\\file that\\exists\\document');
      assert.equal(extension, null);
    });
  });

  describe('#getFileName(filepath)', function()
  {
    it('returns string if no directories', function()
    {
      const name = pathHelpers.getFileName('document.gif');
      assert.equal(name, 'document.gif');
    });

    it('returns name when present with windows seperators', function()
    {
      const name = pathHelpers.getFileName('C:\\my\\path\\to\\file that\\exists\\document.docx');
      assert.equal(name, 'document.docx');
    });

    it('returns name if present with unix seperators', function()
    {
      const name = pathHelpers.getFileName('/usr/my/path/to/file that/exists/document.pdf');
      assert.equal(name, 'document.pdf');
    });
  });

  describe('#getDirectories(filepath)', function()
  {
    it('returns empty array if no directories', function()
    {
      const dirs = pathHelpers.getDirectories('document.gif');
      assert.deepEqual(dirs, []);
    });

    it('returns empty array if empty string', function()
    {
      const dirs = pathHelpers.getDirectories('');
      assert.deepEqual(dirs, []);
    });

    it('returns directories when present with windows seperators', function()
    {
      const dirs = pathHelpers.getDirectories('C:\\my\\path\\to\\file that\\exists\\document.docx');
      assert.deepEqual(dirs, ['my', 'path', 'to', 'file that', 'exists']);
    });

    it('returns directories when present with unix seperators', function()
    {
      const dirs = pathHelpers.getDirectories('/usr/my/path/to/file that/exists/document.pdf');
      assert.deepEqual(dirs, ['usr', 'my', 'path', 'to', 'file that', 'exists']);
    });
  });
});
