'use strict';

module.exports.getFileExtension = function(filepath)
{
  const lastDot = filepath.lastIndexOf('.');

  if (lastDot === -1)
  {
    return null;
  }
  else
  {
    return filepath.substring(lastDot + 1);
  }
};
