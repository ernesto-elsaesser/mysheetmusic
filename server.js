const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SONGS_DIR = path.join(__dirname, 'songs');
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

function safeSongPath(group, name, ext) {
  if (!group || !name) return null;
  const cleanGroup = path.basename(String(group).trim());
  const cleanName = path.basename(String(name).trim());
  if (!cleanGroup || !cleanName || cleanGroup === '.' || cleanName === '.' ||
      cleanGroup === '..' || cleanName === '..') {
    return null;
  }
  return path.join(SONGS_DIR, cleanGroup, cleanName + ext);
}

function renderIndex() {
  let groups = [];
  try {
    groups = fs.readdirSync(SONGS_DIR).filter(item => {
      try { return fs.statSync(path.join(SONGS_DIR, item)).isDirectory(); } catch { return false; }
    });
  } catch { groups = []; }

  let colsHtml = '';
  for (let group of groups) {
    group = group.replace(/\r/g, '').trim();
    if (!group) continue;
    const groupDir = path.join(SONGS_DIR, group);
    if (!fs.existsSync(groupDir)) continue;

    let files = [];
    try { files = fs.readdirSync(groupDir).sort(); } catch { continue; }
    if (files.length === 0) continue;

    let linksHtml = '';
    for (const file of files) {
      if (!file.endsWith('.txt')) continue;
      const songName = file.slice(0, -4);
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
    .replace('{{NAME}}', escapeHtml(name))
    .replace('{{CODE}}', escapeHtml(songCode));
}

// Routes
app.get(['/', '/index', '/index.html', '/index.php'], (req, res) => {
  res.send(renderIndex());
});

app.get(['/song', '/song.php'], (req, res) => {
  const group = req.query.group || '';
  const name = req.query.name || '';
  let song = '';
  const filePath = safeSongPath(group, name, '.txt');
  if (filePath && fs.existsSync(filePath)) {
    try { song = fs.readFileSync(filePath, 'utf-8'); } catch (_) {}
  }
  res.send(renderSongPage(name, group, song));
});

app.post(['/song', '/song.php'], (req, res) => {
  const group = req.query.group || req.body.group || '';
  const name = req.query.name || req.body.name || '';
  const filePath = safeSongPath(group, name, '.txt');

  if (!filePath) {
    return res.status(400).send('Missing or invalid group/name');
  }

  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const code = (req.body.code != null ? String(req.body.code) : '').replace(/\r/g, '');
    fs.writeFileSync(filePath, code, 'utf-8');
    try { fs.chmodSync(filePath, 0o666); } catch (_) {}

    res.send('Saved.');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete(['/song', '/song.php'], (req, res) => {
  const group = req.query.group || '';
  const name = req.query.name || '';
  const filePath = safeSongPath(group, name, '.txt');
  const snapPath = safeSongPath(group, name, '.html');

  try {
    let deleted = false;
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      deleted = true;
    }
    if (snapPath && fs.existsSync(snapPath)) {
      fs.unlinkSync(snapPath);
      deleted = true;
    }
    if (deleted) {
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
