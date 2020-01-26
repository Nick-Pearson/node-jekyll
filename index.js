#!/usr/bin/env node
'use strict';

const pjson = require('./package.json');
const fs = require('fs');
const path = require('path');
const express = require('express');

const Config = require('./src/config.js');
const {buildSite} = require('./src/siteBuilder.js');

const config = loadConfig();

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
    buildSite(config);
  }
  else if (command == 'serve')
  {
    buildSite(config);
    startServer();
    watchFiles();
  }
  else if (command == 'clean')
  {
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
    fs.watch(path.join(config.getSourceDir(), dir), function(event, filename)
    {
      if (fs.existsSync(path.join(config.getSourceDir(), dir, filename)))
      {
        processFile(path.join(dir, filename));
      }
    });
  });
}

function cleanBuild()
{
  removeDirectoriesRecursive(config.getBuildDir());
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
  const dirpath = path.join(config.getSourceDir(), dir);
  const files = fs.readdirSync(dirpath);
  let rv = [];

  files.forEach(function(file)
  {
    if (fs.lstatSync(path.join(dirpath, file)).isDirectory() && !config.isFileExcluded(file))
    {
      rv = rv.concat(getRelevantDirsRecursive(path.join(dir, file)));
      rv.push(path.join(dir, file));
    }
  });

  return rv;
}

function loadConfig()
{
  if (fs.existsSync('_config.yml'))
  {
    return new Config(fs.readFileSync('_config.yml', 'utf8'));
  }
  else
  {
    return new Config();
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
