'use strict';

const assert = require('assert');
const fs = require('fs');

const {execFile} = require('child_process');
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

  function runApp(args)
  {
    args.unshift('../../index.js');
    const app = {
      stdout: '',
      stderr: '',
      error: '',
      cmd: '',
    };
    app.cmd = `running $ node ${args.join(' ')}\n in ${testDirID}`;
    app.handle = execFile('node', args, {cwd: testDirID}, (error, stdout, stderr) =>
    {
      if (error)
      {
        app.error = error;
        return;
      }
      app.stdout += stdout;
      app.stderr += stderr;
    });

    return app;
  }

  it('displays help on when no command', function(done)
  {
    const proc = runApp([]);

    proc.handle.on('close', (code) =>
    {
      assert.strictEqual(code, 0);
      assert.notEqual('', proc.stdout);
      done();
    });
  });

  it('displays help on help', function(done)
  {
    const proc = runApp(['help']);

    proc.handle.on('close', (code) =>
    {
      assert.strictEqual(code, 0);
      assert.notEqual('', proc.stdout);
      done();
    });
  });

  it('copies file to _site on build', function(done)
  {
    fs.writeFileSync(testDirID + '/index.html', '---\n---\n<html><head><title>test</title></head><body><h1>Hello world!</h1></body></html>');

    const proc = runApp(['build']);

    proc.handle.on('close', (code) =>
    {
      assert.strictEqual(code, 0);
      assert.strictEqual(true, fs.existsSync(testDirID + '/index.html'));
      assert.strictEqual(true, fs.existsSync(testDirID + '/_site'));
      done();
    });
  });

  it('deletes _site folder on clean', function(done)
  {
    fs.mkdirSync(testDirID + '/_site');
    fs.writeFileSync(testDirID + '/_site/index.html', '---\n---\n<html><head><title>test</title></head><body><h1>Hello world!</h1></body></html>');
    fs.writeFileSync(testDirID + '/index.html', '---\n---\n<html><head><title>test</title></head><body><h1>Hello world!</h1></body></html>');

    const proc = runApp(['clean']);

    proc.handle.on('close', (code) =>
    {
      assert.strictEqual(code, 0);
      assert.strictEqual(true, fs.existsSync(testDirID + '/index.html'));
      assert.strictEqual(false, fs.existsSync(testDirID + '/_site'));
      done();
    });
  });
});
