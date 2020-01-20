'use strict';

const PathHelpers = {};

const SEPERATOR_REGEX = /[\\|\/]/g;

PathHelpers.getFileExtension = function(filepath)
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

function getLastRegexIndex(regex, str)
{
  let lastMatch = null;

  while (true)
  {
    const match = regex.exec(str);
    if (match == null)
    {
      break;
    }
    else
    {
      lastMatch = match;
    }
  }

  return lastMatch == null ? -1 : lastMatch.index;
}

PathHelpers.getFileName = function(filepath)
{
  const lastSeperator = getLastRegexIndex(SEPERATOR_REGEX, filepath);

  if (lastSeperator == -1)
  {
    return filepath;
  }
  else
  {
    return filepath.substring(lastSeperator + 1);
  }
};

PathHelpers.getDirectories = function(filepath)
{
  const directories = [];
  let lastMatch = null;

  while (true)
  {
    const match = SEPERATOR_REGEX.exec(filepath);

    if (match == null)
    {
      break;
    }
    else if (lastMatch != null)
    {
      directories.push(filepath.substring(lastMatch.index + 1, match.index));
    }

    lastMatch = match;
  }

  return directories;
};

module.exports = PathHelpers;
