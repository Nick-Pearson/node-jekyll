'use strict';

const yaml = require('js-yaml');

module.exports.frontMatter = (contents) =>
{
  if (contents === null || contents === undefined)
  {
    return {frontmatter: null, remaining: contents};
  }

  if (contents.startsWith('---'))
  {
    const endOfBlock = contents.indexOf('---', 3);

    if (endOfBlock === -1)
    {
      throw new Error('Failed to find end of frontmatter');
    }

    const yamlBlock = contents.substring(3, endOfBlock);
    const frontmatter = yaml.safeLoad(yamlBlock);
    return {frontmatter: frontmatter === undefined ? {} : frontmatter, remaining: contents.substring(endOfBlock + 4)};
  }

  return {frontmatter: null, remaining: contents};
};

