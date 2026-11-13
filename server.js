const express = require('express');
const fs = require('fs');
const { Storage } = require('@google-cloud/storage');
const { decodeSong, extractSounds } = require('./parser');
const { renderSong } = require('./render');

const app = express();
const PORT = process.env.PORT || 8080;
const BUCKET_NAME = process.env.BUCKET_NAME || 'erns-songs';

const storage = new Storage();
const bucket = storage.bucket(BUCKET_NAME);

app.use(express.json());
app.use(express.static('public'));


app.get('/', async (req, res) => {

  const groupsMap = new Map();
  const [files] = await bucket.getFiles();

  for (const file of files) {
    if (file.name.endsWith('/')) continue;
    const slashIndex = file.name.indexOf('/');
    if (slashIndex === -1) continue;
    const group = file.name.substring(0, slashIndex);
    const name = file.name.substring(slashIndex + 1);

    if (!groupsMap.has(group)) groupsMap.set(group, []);
    groupsMap.get(group).push(name);
  }

  const sortedGroups = Array.from(groupsMap.keys()).sort((a, b) => {
    return groupsMap.get(b).length - groupsMap.get(a).length || a.localeCompare(b);
  });
  let colsHtml = '';

  for (const group of sortedGroups) {
    const songNames = groupsMap.get(group).sort();
    let linksHtml = '';
    for (const songName of songNames) {
      linksHtml += `<a target="_blank" href="sheet?group=${encodeURIComponent(group)}&name=${encodeURIComponent(songName)}">${songName}</a><br/>\n`;
    }
    colsHtml += `<div class="col"><h2>${group}</h2>\n${linksHtml}` +
      `<form action="sheet" target="_blank"><input type="text" name="name" />` +
      `<input type="text" name="group" value="${group}" hidden /> ` +
      `<input type="submit" value="+" /></form></div>\n`;
  }

  const html = fs.readFileSync('index.html', 'utf-8')
    .replace('{{COLUMNS}}', colsHtml);

  res.send(html);
});

app.get('/sheet', async (req, res) => {
  const { group, name, offset = '0' } = req.query;
  const editUrl = `/edit?group=${encodeURIComponent(group)}&name=${encodeURIComponent(name)}`;
  const file = bucket.file(`${group}/${name}`);
  const [exists] = await file.exists();
  let song = {};
  let sounds = [];
  let sheet = "";
  let error = "";
  if (exists) {
    const snapshot = await file.download();
    const code = snapshot[0].toString('utf-8');
    const scaleOffset = parseInt(offset);
    try {
      song = decodeSong(code);
      sheet = renderSong(song, scaleOffset);
      sounds = extractSounds(song);
    } catch (err) {
      error = err.toString();
    }
  }

  const html = fs.readFileSync('sheet.html', 'utf-8')
    .replace('{{NAME}}', name)
    .replace('{{SHEET}}', sheet)
    .replace('{{ERROR}}', error)
    .replace('{{SOUNDS}}', JSON.stringify(sounds));
  res.send(html);
});

app.get('/editor', async (req, res) => {
  const { group, name } = req.query;
  const file = bucket.file(`${group}/${name}`);
  const [exists] = await file.exists();
  let code = '';
  if (exists) {
    const snapshot = await file.download();
    code = snapshot[0].toString('utf-8');
  }
  const html = fs.readFileSync('editor.html', 'utf-8')
    .replace('{{NAME}}', name)
    .replace('{{CODE}}', code);
  res.send(html);
});

app.post('/editor', async (req, res) => {
  const { group, name } = req.query;
  const file = bucket.file(`${group}/${name}`);
  await file.save(req.body.code, {
    contentType: 'text/plain; charset=utf-8',
    resumable: false
  });
  res.send('Saved.');
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`listening at http://localhost:${PORT}/`);
  });
}

module.exports = app;
