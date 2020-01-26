'use strict';

const yaml = require('js-yaml');
const path = require('path');

const pathHelpers = require('./pathHelpers.js');


function Config(configString)
{
  if (configString !== undefined)
  {
    this.data = yaml.safeLoad(configString);
  }
  else
  {
    this.data = {};
  }
}

function isInExcludedDirectory(file)
{
  const filename = pathHelpers.getFileName(file);
  const directories = pathHelpers.getDirectories(file);

  return filename.startsWith('_') || directories.some((dir) => dir.startsWith('_'));
}

Config.prototype.isFileExcluded = function(file)
{
  let excludedFiles = this.data.exclude;
  if (!Array.isArray(excludedFiles))
  {
    excludedFiles = [];
  }

  return excludedFiles.includes(file) || isInExcludedDirectory(file);
};

Config.prototype.getSourceDir = function()
{
  let source = this.data.source;
  if (source === undefined)
  {
    source = '.';
  }

  return path.join(process.cwd(), source);
};

Config.prototype.getBuildDir = function()
{
  let dest = this.data.destination;
  if (dest === undefined)
  {
    dest = './_site';
  }

  return path.join(process.cwd(), dest);
};

module.exports = Config;
