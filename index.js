#!/usr/bin/env node
"use strict";

var pjson = require('./package.json');
var yaml = require('js-yaml');
var fs   = require('fs');
var path   = require('path');

var config = {};

// TODO: implement markdown rendering (showdown?)
var buildextensions = ["html"];

/*
 * AIMS:
 * build - builds the site based on changed files
 * serve - builds and starts a webserver
 * clean - removes the built site
 * help - displays a help message, also the default if the command is unreconised
 */

let args = process.argv.splice(2);

if(args.length == 0)
{
  console.log("Unreconised command");
  displayHelp();
}
else
{
  let command = args[0].toLowerCase();

  if(command == "build")
  {
    parseConfig();
    buildSite();
  }
  else if (command == "serve")
  {
    parseConfig();
    buildSite();
    startServer();
    watchFiles();
  }
  else if(command == "clean")
  {
    parseConfig();
    cleanBuild();
  }
  else if(command == "help")
  {
    displayHelp();
  }
  else
  {
    console.log("Unreconised command");
    displayHelp();
  }
}

/********************
 * Functions
*********************/

function buildSite()
{
  let files = getRelevantFiles();

  let srcDir = process.cwd();
  let buildDir = path.join(srcDir, "_site");

  if(!fs.existsSync(buildDir))
  {
    fs.mkdir(buildDir);
  }

  files.forEach(function(file) {
    let parts = file.split(".");
    let extension = (parts.length == 0) ? "" : parts[parts.length - 1];

    if(buildextensions.includes(extension))
    {
      buildFile(path.join(srcDir, file), path.join(buildDir, file), true);
    }
    else
    {
      asyncCopyFile(path.join(srcDir, file), path.join(buildDir, file));
    }
  });
}

function startServer()
{

}

function watchFiles()
{

}

function cleanBuild()
{

}

function buildFile(srcPath, destPath, ensureFrontmatter= true, variables = {})
{
  if(variables == undefined)
  {
    variables = {};
  }

  if(variables.page == undefined)
  {
    variables.page = {};
  }

  let inbuffer = "";
  let outbuffer = "";
  let stream = fs.createReadStream(srcPath);
  stream.setEncoding('utf-8');
  stream.on('data', (chunk) => {
    inbuffer += chunk;
  });

  stream.on('end', () => {
    let lines = inbuffer.split('\n');
    let layout = undefined;
    let lineIdx = 0;

    if(lines[0].startsWith("---"))
    {
      // parse front matter
      while(lineIdx < lines.length-1)
      {
        lineIdx++;
        if(lines[lineIdx].startsWith("---"))
        {
          lineIdx++;
          break;
        }

        let parts = lines[lineIdx].split(":");

        if(parts[0] == "layout")
        {
          layout = parts[1].trim();
        }
        else if(parts[0] != "")
        {
          variables.page[parts[0]] = parts[1];
        }
      }
    }
    else if(ensureFrontmatter)
    {
      // just copy the file
      asyncCopyFile(srcPath, destPath);
      return;
    }

    while(lineIdx < lines.length)
    {
      let string = lines[lineIdx];
      let result = "";

      do
      {
        let vidx = string.indexOf("{{");
        let cidx = string.indexOf("{%");

        let startIdx = -1;
        let endIdx = -1;

        if((vidx < cidx || cidx == -1) && vidx != -1)
        {
          startIdx = vidx;
          endIdx = string.indexOf("}}");
        }
        else if(cidx != -1)
        {
          startIdx = cidx;
          endIdx = string.indexOf("%}");
        }
        else
        {
          break;
        }

        if(endIdx == -1)
        {
          console.warn("No end found to command ln:" + lineIdx + ", " + srcPath);
          break;
        }

        //add the string up to the variable to result
        result += string.substring(0, startIdx);

        //process the command portion and add it to the result
        result += processCommand(string.substring(startIdx + 2, endIdx), variables);

        //trim string to the next part we haven't processed
        string = string.substr(endIdx + 2);
      } while(true);

      outbuffer +=  result + string + "\n";
      lineIdx++;
    }

    if(layout != undefined)
    {
      variables.content = outbuffer;
      buildFile(path.join(process.cwd(), "_layouts", layout + ".html"), destPath, false, variables);
    }
    else
    {
      let wstream = fs.createWriteStream(destPath);
      wstream.end(outbuffer, 'utf-8');
    }
  });
}

function processCommand(cmd, variables)
{
  let words = cmd.trim().split(" ");

  if(words.length == 0)
  {
    return "";
  }

  if(words[0] == "include")
  {
    return fs.readFileSync(path.join(process.cwd(), "_includes", words[1]), 'utf-8');
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
  let dir = path.dirname(filepath);

  if(!fs.existsSync(dir))
  {
    createDirectoriesRecursive(dir);
  }
}

function createDirectoriesRecursive(dir)
{
  let pdir = path.dirname(dir);

  if(!fs.existsSync(pdir))
  {
    createDirectoriesRecursive(pdir);
  }

  fs.mkdir(dir);
}

function getRelevantFiles()
{
  let excludedFiles = [".git", "node_modules", "_layouts", "_includes", "_site", "_config.yml"];

  if(typeof(config.exclude) !== undefined)
  {
    excludedFiles = excludedFiles.concat(config.exclude);
  }

  return getRelevantFilesRecursive(process.cwd(), "", excludedFiles);
}

function getRelevantFilesRecursive(rootPath, relativePath, excludedFiles)
{
  let dirpath = path.join(rootPath, relativePath);
  let files = fs.readdirSync(dirpath);
  let returnVal = [];

  files.forEach(function(file) {
    if(!excludedFiles.includes(file))
    {
      let fullpath = path.join(dirpath, file);
      // if this is a directory then do a recursive call
      if(fs.lstatSync(fullpath).isDirectory())
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
  }
  catch (e)
  {
    config = {};
  }
}

function displayHelp()
{
  console.log("");
  console.log("Help:");
  console.log("");

  if(typeof(pjson.name) !== undefined)
  {
    console.log("** " + pjson.name + " **");
  }

  if(typeof(pjson.description) !== undefined)
  {
    console.log(pjson.description);
  }

  console.log("");
  console.log("Usage: njekyll <command>");
  console.log("Commands:")

  console.log("- build    Builds the site and saves it to the _site folder");
  console.log("- serve    Builds the site starts a webserver in the _site folder to preview changes");
  console.log("- clean    Deletes the _site folder if it exists");
  console.log("- help     Shows this help message");
}
