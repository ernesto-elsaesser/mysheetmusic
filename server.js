const express = require('express');
const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');

const app = express();
const PORT = process.env.PORT || 8080;
const BUCKET_NAME = process.env.BUCKET_NAME || 'erns-songs';
const PUBLIC_DIR = path.join(__dirname, 'public');

const storage = new Storage();
const bucket = storage.bucket(BUCKET_NAME);

app.use(express.json());
app.use(express.static(PUBLIC_DIR));


function getSongKey(group, name) {
  if (!group || !name) return null;
  const cleanGroup = String(group).trim();
  const cleanName = String(name).trim();
  if (!cleanGroup || !cleanName) return null;
  return `${group}/${name}`;
}

async function renderIndex() {
  const groupsMap = new Map();

  try {
    const [files] = await bucket.getFiles();
    for (const file of files) {
      if (file.name.endsWith('/')) continue;
      const slashIndex = file.name.indexOf('/');
      if (slashIndex === -1) continue;
      const group = file.name.substring(0, slashIndex);
      const name = file.name.substring(slashIndex + 1);
      if (!group || !name) continue;

      if (!groupsMap.has(group)) {
        groupsMap.set(group, []);
      }
      groupsMap.get(group).push(name);
    }
  } catch (err) {
    console.error('Error fetching files from bucket:', err);
  }

  const sortedGroups = Array.from(groupsMap.keys()).sort();

  let colsHtml = '';
  for (const group of sortedGroups) {
    const songNames = groupsMap.get(group).sort();
    let linksHtml = '';
    for (const songName of songNames) {
      linksHtml += `<a target="_blank" href="song?group=${encodeURIComponent(group)}&name=${encodeURIComponent(songName)}">${songName}</a><br/>\n`;
    }

    colsHtml += `<div class="col"><h2>${group}</h2>\n${linksHtml}` +
      `<form action="song" target="_blank"><input type="text" name="name" />` +
      `<input type="text" name="group" value="${group}" hidden /> ` +
      `<input type="submit" value="+" /></form></div>\n`;
  }

  const template = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
  return template.replace('{{COLUMNS}}', colsHtml);
}

function renderSongPage(name, group, songCode) {
  const template = fs.readFileSync(path.join(__dirname, 'song.html'), 'utf-8');
  return template
    .replace('{{NAME}}', name)
    .replace('{{CODE}}', songCode);
}

// Routes
app.get('/', async (req, res, next) => {
  try {
    const html = await renderIndex();
    res.send(html);
  } catch (err) {
    next(err);
  }
});

app.get('/song', async (req, res, next) => {
  try {
    const group = req.query.group || '';
    const name = req.query.name || '';
    let song = '';
    const key = getSongKey(group, name);

    if (key) {
      const file = bucket.file(key);
      const [exists] = await file.exists();
      if (exists) {
        const [content] = await file.download();
        song = content.toString('utf-8');
      }
    }
    res.send(renderSongPage(name, group, song));
  } catch (err) {
    next(err);
  }
});

app.post('/song', async (req, res) => {
  const group = req.query.group || req.body.group || '';
  const name = req.query.name || req.body.name || '';
  const key = getSongKey(group, name);

  if (!key) {
    return res.status(400).send('Missing or invalid group/name');
  }

  try {
    const code = (req.body.code != null ? String(req.body.code) : '').replace(/\r/g, '');
    const file = bucket.file(key);
    await file.save(code, {
      contentType: 'text/plain; charset=utf-8',
      resumable: false
    });

    res.send('Saved.');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/song', async (req, res) => {
  const group = req.query.group || '';
  const name = req.query.name || '';
  const key = getSongKey(group, name);

  if (!key) {
    return res.status(400).send('Missing or invalid group/name');
  }

  try {
    const file = bucket.file(key);
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      res.send('Deleted.');
    } else {
      res.status(404).send('Not Found');
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`MySheetMusic server running at http://localhost:${PORT}/`);
  });
}

module.exports = app;
