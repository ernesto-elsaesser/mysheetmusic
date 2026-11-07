const express = require('express');
const fs = require('fs');
const { Storage } = require('@google-cloud/storage');
const { decodeSong, extractMelody } = require('./parser');
const { renderStave } = require('./render');

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
      `<form action="song" target="_blank"><input type="text" name="name" />` +
      `<input type="text" name="group" value="${group}" hidden /> ` +
      `<input type="submit" value="+" /></form></div>\n`;
  }

  const html = fs.readFileSync('index.html', 'utf-8')
    .replace('{{COLUMNS}}', colsHtml);

  res.send(html);
});

app.get('/song', async (req, res) => {
  const { group, name } = req.query;
  const file = bucket.file(`${group}/${name}`);
  const [exists] = await file.exists();
  let song = {};
  if (exists) {
    const snapshot = await file.download();
    const code = snapshot[0].toString('utf-8');
    song = decodeSong(code);
  }
  const json = JSON.stringify(song);
  
  // JSON migration
  await bucket.file(`SONGS/${group}/${name}`).save(json, {
    contentType: 'application/json',
    resumable: false
  });

  res.set('Content-Type', 'application/json');
  res.send(json);
});

app.get('/sheet', async (req, res) => {
  const { group, name, offset = '0' } = req.query;
  const editUrl = `/edit?group=${encodeURIComponent(group)}&name=${encodeURIComponent(name)}`;
  const file = bucket.file(`${group}/${name}`);
  const [exists] = await file.exists();
  let song = {};
  let sounds = [];
  let sheet = "";
  if (exists) {
    const snapshot = await file.download();
    const code = snapshot[0].toString('utf-8');
    song = decodeSong(code);
    // TODO: fetch song object via GET /song, then extract melody on client side
    sounds = extractSounds(song);
    const scaleOffset = parseInt(offset);
    const last = song.length - 1;
    for (let i = 0; i < song.length; i += 1) {
        const measure = song[i];
        const textLengths = measure.lyrics.map((l) => l.length);
        const notesLength = Math.max(measure.notes.length, 3) * 3;
        const maxLength = Math.max(notesLength, ...textLengths);
        const width = Math.max(40, (maxLength + 1) * 9);
        const tieEnd = i < last ? song[i+1].notes[0].tie : false;
        const svg = renderStave("black", width, measure.notes, tieEnd, scaleOffset);
        const lyrics = measure.lyrics.join("<br>");
        sheet += `<div class="measure" style="width: ${width}px;">` +
            `<div class="frame">${svg}</div>` +
            `<div class="lyrics">${lyrics}</div></div>\n`;
    }
  }

  const html = fs.readFileSync('sheet.html', 'utf-8')
    .replace('{{NAME}}', name)
    .replace('{{SHEET}}', sheet)
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
