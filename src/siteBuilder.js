'use strict';

const fs = require('fs');
const path = require('path');

const showdown = require('showdown');
const converter = new showdown.Converter();
const pathHelpers = require('./pathHelpers.js');
const frontMatter = require('./frontMatter.js');

const buildextensions = ['html', 'md'];

module.exports.buildSite = function(config)
{
  const files = getRelevantFiles(config);

  if (!fs.existsSync(config.getBuildDir()))
  {
    fs.mkdirSync(config.getBuildDir());
  }

  files.forEach(function(file)
  {
    processFile(config, file);
  });
};

function processFile(config, file)
{
  const fullpath = path.join(config.getSourceDir(), file);
  let dpath = path.join(config.getBuildDir(), file);

  const stats = fs.lstatSync(fullpath);
  if (stats.isDirectory()) return;

  const extension = pathHelpers.getFileExtension(file);

  if (extension == 'md')
  {
    dpath = dpath.substr(0, dpath.length - 3) + '.html';
  }

  if (fs.existsSync(dpath))
  {
    const dstats = fs.lstatSync(dpath);
    if (dstats.mtime >= stats.mtime) return;
  }

  if (buildextensions.includes(extension))
  {
    console.log('Building ' + file);
    let func = (src) =>
    {
      return src;
    };

    if (extension == 'md')
    {
      func = (src) =>
      {
        return converter.makeHtml(src);
      };
    }

    buildFile(fullpath, dpath, true, {}, func);
  }
  else
  {
    console.log('Copying ' + file);
    asyncCopyFile(fullpath, dpath);
  }
}

function buildFile(srcPath, destPath, ensureFrontmatter= true, variables = {}, buildFunc = (src) =>
{
  return src;
})
{
  if (variables == undefined)
  {
    variables = {};
  }

  if (variables.page == undefined)
  {
    variables.page = {};
  }

  let inbuffer = '';
  const stream = fs.createReadStream(srcPath);
  stream.setEncoding('utf-8');
  stream.on('data', (chunk) =>
  {
    inbuffer += chunk;
  });

  stream.on('end', () =>
  {
    let outbuffer = '';
    let lineIdx = 0;

    const a = frontMatter.frontMatter(inbuffer);
    const lines = a.remaining.split('\n');
    const frontmatter = a.frontmatter;

    variables.page = frontmatter;
    if (frontmatter == null && ensureFrontmatter)
    {
      // just copy the file
      console.log('copying ' + srcPath + ' directly as no frontmatter was found');
      asyncCopyFile(srcPath, destPath);
      return;
    }

    while (lineIdx < lines.length)
    {
      let string = lines[lineIdx];
      let result = '';

      do
      {
        const vidx = string.indexOf('{{');
        const cidx = string.indexOf('{%');

        let startIdx = -1;
        let endIdx = -1;

        if ((vidx < cidx || cidx == -1) && vidx != -1)
        {
          startIdx = vidx;
          endIdx = string.indexOf('}}');
        }
        else if (cidx != -1)
        {
          startIdx = cidx;
          endIdx = string.indexOf('%}');
        }
        else
        {
          break;
        }

        if (endIdx == -1)
        {
          console.warn('No end found to command ln:' + lineIdx + ', ' + srcPath);
          break;
        }

        // add the string up to the variable to result
        result += string.substring(0, startIdx);

        // process the command portion and add it to the result
        result += processCommand(string.substring(startIdx + 2, endIdx), variables);

        // trim string to the next part we haven't processed
        string = string.substr(endIdx + 2);
      } while (true);

      outbuffer += result + string + '\n';
      lineIdx++;
    }

    if (frontmatter.layout != undefined)
    {
      variables.content = outbuffer;
      buildFile(path.join(process.cwd(), '_layouts', frontmatter.layout + '.html'), destPath, false, variables);
    }
    else
    {
      const wstream = fs.createWriteStream(destPath);
      wstream.end(outbuffer, 'utf-8');
    }
  });
}

function processCommand(cmd, variables)
{
  const words = cmd.trim().split(' ');

  if (words.length == 0)
  {
    return '';
  }

  if (words[0] == 'include')
  {
    return fs.readFileSync(path.join(process.cwd(), '_includes', words[1]), 'utf-8');
  }
  else
  {
    return variables[words[0]];
  }
}

function asyncCopyFile(srcPath, destPath)
{
  createDirectories(destPath);
  fs.createReadStream(srcPath).pipe(fs.createWriteStream(destPath));
}

function createDirectories(filepath)
{
  const dir = path.dirname(filepath);

  if (!fs.existsSync(dir))
  {
    createDirectoriesRecursive(dir);
  }
}

function createDirectoriesRecursive(dir)
{
  const pdir = path.dirname(dir);

  if (!fs.existsSync(pdir))
  {
    createDirectoriesRecursive(pdir);
  }

  fs.mkdirSync(dir);
}

function getRelevantFiles(config)
{
  return getRelevantFilesRecursive(config, process.cwd(), '');
}

function getRelevantFilesRecursive(config, rootPath, relativePath)
{
  const dirpath = path.join(rootPath, relativePath);
  const files = fs.readdirSync(dirpath);
  let returnVal = [];

  files.forEach(function(file)
  {
    if (!config.isFileExcluded(file))
    {
      const fullpath = path.join(dirpath, file);
      // if this is a directory then do a recursive call
      if (fs.lstatSync(fullpath).isDirectory())
      {
        returnVal = returnVal.concat(getRelevantFilesRecursive(config, rootPath, path.join(relativePath, file)));
      }
      else
      {
        returnVal.push(path.join(relativePath, file));
      }
    }
  });

  return returnVal;
}
