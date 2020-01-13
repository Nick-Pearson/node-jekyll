#!/usr/bin/env node
'use strict';

const pjson = require('./package.json');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const express = require('express');

const showdown = require('showdown');
const converter = new showdown.Converter();

let config = {};

const pageBuilder = require('./src/pageBuilder.js');
const pathHelpers = require('./src/pathHelpers.js');

const buildextensions = ['html', 'md'];

const srcDir = process.cwd();
const buildDir = path.join(srcDir, '_site');

let excludedFiles = ['_layouts', '_includes', '_site', '_config.yml'];

/*
 * AIMS:
 * build - builds the site based on changed files
 * serve - builds and starts a webserver
 * clean - removes the built site
 * help - displays a help message, also the default if the command is unreconised
 */

const args = process.argv.splice(2);

if (args.length == 0)
{
  console.log('Unreconised command');
  displayHelp();
}
else
{
  const command = args[0].toLowerCase();

  if (command == 'build')
  {
    parseConfig();
    buildSite();
  }
  else if (command == 'serve')
  {
    parseConfig();
    buildSite();
    startServer();
    watchFiles();
  }
  else if (command == 'clean')
  {
    parseConfig();
    cleanBuild();
  }
  else if (command == 'help')
  {
    displayHelp();
  }
  else
  {
    console.log('Unreconised command');
    displayHelp();
  }
}

function buildSite()
{
  const files = getRelevantFiles();

  if (!fs.existsSync(buildDir))
  {
    fs.mkdir(buildDir);
  }

  files.forEach(function(file)
  {
    processFile(file);
  });
}

function processFile(file)
{
  const fullpath = path.join(srcDir, file);
  const dpath = path.join(buildDir, file);

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

function startServer()
{
  const app = express();

  app.use(express.static('_site'));

  app.listen(4000, () =>
  {
    console.log('Website is built!\nPreview by entering http://localhost:4000/ into your web browser');
  });
}

function watchFiles()
{
  const dirs = getRelevantDirs();

  dirs.forEach(function(dir)
  {
    fs.watch(path.join(srcDir, dir), function(event, filename)
    {
      if (fs.existsSync(path.join(srcDir, dir, filename)))
      {
        processFile(path.join(dir, filename));
      }
    });
  });
}

function cleanBuild()
{
  removeDirectoriesRecursive(buildDir);
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
    pageBuilder.buildPage(inbuffer);
  });
}

// eslint-disable-next-line no-unused-vars
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

function removeDirectoriesRecursive(path)
{
  if (!fs.existsSync(path)) return;

  fs.readdirSync(path).forEach(function(file)
  {
    const curPath = path + '/' + file;

    if (fs.lstatSync(curPath).isDirectory())
    {
      removeDirectoriesRecursive(curPath);
    }
    else
    {
      fs.unlinkSync(curPath);
    }
  });

  fs.rmdirSync(path);
}

function getRelevantDirs()
{
  const dirs = [''];
  return dirs.concat(getRelevantDirsRecursive(''));
}

function getRelevantDirsRecursive(dir)
{
  const dirpath = path.join(srcDir, dir);
  const files = fs.readdirSync(dirpath);
  let rv = [];

  files.forEach(function(file)
  {
    if (fs.lstatSync(path.join(dirpath, file)).isDirectory() && !file.startsWith('.') && !excludedFiles.includes(file))
    {
      rv = rv.concat(getRelevantDirsRecursive(path.join(dir, file)));
      rv.push(path.join(dir, file));
    }
  });

  return rv;
}

function getRelevantFiles()
{
  return getRelevantFilesRecursive(process.cwd(), '');
}

function getRelevantFilesRecursive(rootPath, relativePath)
{
  const dirpath = path.join(rootPath, relativePath);
  const files = fs.readdirSync(dirpath);
  let returnVal = [];

  files.forEach(function(file)
  {
    if (!excludedFiles.includes(file) && !file.startsWith('.'))
    {
      const fullpath = path.join(dirpath, file);
      // if this is a directory then do a recursive call
      if (fs.lstatSync(fullpath).isDirectory())
      {
        returnVal = returnVal.concat(getRelevantFilesRecursive(rootPath, path.join(relativePath, file), excludedFiles));
      }
      else
      {
        returnVal.push(path.join(relativePath, file));
      }
    }
  });

  return returnVal;
}


function parseConfig()
{
  try
  {
    config = yaml.safeLoad(fs.readFileSync('_config.yml', 'utf8'));

    if (typeof(config.exclude) !== undefined)
    {
      excludedFiles = excludedFiles.concat(config.exclude);
    }
  }
  catch (e)
  {
    config = {};
  }
}

function displayHelp()
{
  console.log('');
  console.log('Help:');
  console.log('');

  if (typeof(pjson.name) !== undefined)
  {
    console.log('** ' + pjson.name + ' **');
  }

  if (typeof(pjson.description) !== undefined)
  {
    console.log(pjson.description);
  }

  console.log('');
  console.log('Usage: njekyll <command>');
  console.log('Commands:');

  console.log('- build    Builds the site and saves it to the _site folder');
  console.log('- serve    Builds the site starts a webserver in the _site folder to preview changes');
  console.log('- clean    Deletes the _site folder if it exists');
  console.log('- help     Shows this help message');
}
