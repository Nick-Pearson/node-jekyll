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
});
