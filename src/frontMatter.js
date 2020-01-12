'use strict';

const yaml = require('js-yaml');

module.exports.frontMatter = (contents) =>
{
  if (contents === null || contents === undefined)
  {
    return null;
  }

  if (contents.startsWith('---'))
  {
    const endOfBlock = contents.indexOf('---', 3);

    if (endOfBlock === -1)
    {
      throw new Error('Failed to find end of frontmatter');
    }

    const yamlBlock = contents.substring(3, endOfBlock);
    return yaml.safeLoad(yamlBlock);
  }

  return null;
};

