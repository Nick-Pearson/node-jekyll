'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Uuid = require('uuid-lib');

describe('integrationTest', function()
{
  before(function createTempDir()
  {
    if (!fs.existsSync('temp'))
    {
      fs.mkdirSync('temp');
    }
  });

  let testDirID = '';
  beforeEach(function createTestDir()
  {
    testDirID = 'temp/' + Uuid.raw();
    fs.mkdirSync(testDirID);
  });

  afterEach(function removeTestDir()
  {
    fs.rmdirSync(testDirID, {recursive: true});
  });

  async function runApp(args)
  {
    args.unshift('');
    args.unshift('');
    process.argv = args;
    const proc = {
      stdout: '',
    };

    process.stdout.write = function(chunk)
    {
      proc.stdout += chunk;
    };
    const fullTestDirPath = path.join(__dirname, '../', testDirID);
    process.chdir(fullTestDirPath);

    require('../index.js');
    // TODO: Wait for app to finish
    await new Promise((resolve) => setTimeout(resolve, 1000));

    process.chdir(path.join(__dirname, '../'));
    return proc;
  }

  it('displays help on when no command', async function()
  {
    const proc = runApp([]);
    await proc;

    assert.notEqual('', proc.stdout);
  });

  it('displays help on help', async function()
  {
    const proc = runApp(['help']);
    await proc;

    assert.notEqual('', proc.stdout);
  });

  it('copies file to _site on build', async function()
  {
    fs.writeFileSync(testDirID + '/index.html', '---\n---\n<html><head><title>test</title></head><body><h1>Hello world!</h1></body></html>');
    fs.mkdirSync(testDirID + '/_layouts');
    fs.writeFileSync(testDirID + '/_layouts/default.html', '---\n---\n<html><head><title>test</title></head><body>{{content}}</body></html>');
    fs.writeFileSync(testDirID + '/testA.html', '---\nlayout: default\n---\n<h1>Hello World</h1>');

    const proc = runApp(['build']);
    await proc;

    assert.strictEqual(fs.existsSync(testDirID + '/index.html'), true);
    assert.strictEqual(fs.existsSync(testDirID + '/_site'), true);
    assert.strictEqual(fs.existsSync(testDirID + '/_site/index.html'), true);
    assert.equal(
        fs.readFileSync(testDirID + '/_site/index.html') + '',
        '<html><head><title>test</title></head><body><h1>Hello world!</h1></body></html>\n');
    assert.strictEqual(fs.existsSync(testDirID + '/_site/testA.html'), true);
    assert.equal(
        fs.readFileSync(testDirID + '/_site/testA.html') + '',
        '<html><head><title>test</title></head><body><h1>Hello World</h1>\n</body></html>\n');
  });

  it('deletes _site folder on clean', async function()
  {
    fs.mkdirSync(testDirID + '/_site');
    fs.writeFileSync(testDirID + '/_site/index.html', '---\n---\n<html><head><title>test</title></head><body><h1>Hello world!</h1></body></html>');
    fs.writeFileSync(testDirID + '/index.html', '---\n---\n<html><head><title>test</title></head><body><h1>Hello world!</h1></body></html>');

    await runApp(['clean']);

    assert.strictEqual(true, fs.existsSync(testDirID + '/index.html'));
    assert.strictEqual(false, fs.existsSync(testDirID + '/_site'));
  });
});
