'use strict';

module.exports.buildPage = (inbuffer) =>
{
  const lines = inbuffer.split('\n');
  let outbuffer = '';
  let layout = undefined;
  let lineIdx = 0;

  if (lines[0].startsWith('---'))
  {
    // parse front matter
    while (lineIdx < lines.length-1)
    {
      lineIdx++;
      if (lines[lineIdx].startsWith('---'))
      {
        lineIdx++;
        break;
      }

      const parts = lines[lineIdx].split(':');

      if (parts[0] == 'layout')
      {
        layout = parts[1].trim();
      }
      else if (parts[0] != '')
      {
        variables.page[parts[0]] = parts[1];
      }
    }
  }
  else if (ensureFrontmatter)
  {
    // just copy the file
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

  if (layout != undefined)
  {
    variables.content = outbuffer;
    buildFile(path.join(process.cwd(), '_layouts', layout + '.html'), destPath, false, variables);
  }
  else
  {
    const wstream = fs.createWriteStream(destPath);
    wstream.end(outbuffer, 'utf-8');
  }
};
