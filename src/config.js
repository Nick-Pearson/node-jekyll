'use strict';

const yaml = require('js-yaml');

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

Config.prototype.isFileExcluded = (file) =>
{
  return false;
};

module.exports = Config;
