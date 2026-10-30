const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const SONGS_DIR = path.join(__dirname, 'songs');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.mxl': 'application/vnd.recordare.musicxml+xml',
  '.xml': 'application/xml; charset=utf-8'
};

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeSongPath(group, name, ext) {
  if (!group || !name) return null;
  const cleanGroup = path.basename(group.trim());
  const cleanName = path.basename(name.trim());
  if (!cleanGroup || !cleanName || cleanGroup === '.' || cleanName === '.' ||
      cleanGroup === '..' || cleanName === '..') {
    return null;
  }
  return path.join(SONGS_DIR, cleanGroup, cleanName + ext);
}

function parseBody(req, buffer) {
  const str = buffer.toString('utf-8');
  if (!str) return {};
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}

function serveStaticFile(req, res, pathname) {
  const safePath = path.normalize(path.join(__dirname, pathname)).replace(/^(\.\.[\/\\])+/, '');
  if (!safePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return true;
  }
  if (fs.existsSync(safePath)) {
    try {
      const stat = fs.statSync(safePath);
      if (stat.isFile()) {
        const ext = path.extname(safePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(safePath).pipe(res);
        return true;
      }
    } catch {
      return false;
    }
  }
  return false;
}

function renderIndex() {
  const groupsFile = path.join(SONGS_DIR, 'groups.txt');
  let groups = [];
  if (fs.existsSync(groupsFile)) {
    groups = fs.readFileSync(groupsFile, 'utf-8').split('\n');
  } else if (fs.existsSync(SONGS_DIR)) {
    try {
      groups = fs.readdirSync(SONGS_DIR).filter(item => {
        try {
          return fs.statSync(path.join(SONGS_DIR, item)).isDirectory();
        } catch {
          return false;
        }
      });
    } catch {
      groups = [];
    }
  }

  let colsHtml = '';
  for (let group of groups) {
    group = group.replace(/\r/g, '').trim();
    if (!group) continue;
    const groupDir = path.join(SONGS_DIR, group);
    if (!fs.existsSync(groupDir)) continue;

    let files = [];
    try {
      files = fs.readdirSync(groupDir).sort();
    } catch {
      continue;
    }
    if (files.length === 0) continue;

    let linksHtml = '';
    for (const file of files) {
      if (!file.endsWith('.txt')) continue;
      const songName = file.slice(0, -4);
      linksHtml += `<a target="_blank" href="song.php?group=${encodeURIComponent(group)}&name=${encodeURIComponent(songName)}">${escapeHtml(songName)}</a><br/>\n`;
    }

    colsHtml += `<div class="col"><h2>${escapeHtml(group)}</h2>\n${linksHtml}` +
      `<form action="song.php" target="_blank"><input type="text" name="name" />` +
      `<input type="text" name="group" value="${escapeHtml(group)}" hidden /> ` +
      `<input type="submit" value="+" /></form></div>\n`;
  }

  const templatePath = path.join(__dirname, 'index.html');
  const template = fs.readFileSync(templatePath, 'utf-8');
  return template.replace('{{COLUMNS}}', colsHtml);
}

function renderSongPage(name, group, songCode, sheetHtml) {
  const templatePath = path.join(__dirname, 'song.html');
  const template = fs.readFileSync(templatePath, 'utf-8');
  return template
    .replace('{{NAME}}', escapeHtml(name))
    .replace('{{SHEET}}', sheetHtml)
    .replace('{{CODE}}', escapeHtml(songCode));
}

const server = http.createServer((req, res) => {
  const host = req.headers.host || `localhost:${PORT}`;
  const parsedUrl = new URL(req.url, `http://${host}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Normalize index routes
  if (pathname === '/index' || pathname === '/index.html' || pathname === '/index.php') {
    pathname = '/';
  }

  // 1. Index Page
  if (pathname === '/') {
    if (req.method === 'GET') {
      const html = renderIndex();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }
  }

  // 2. Song Page & API (supports both clean /song and legacy /song.php)
  if (pathname === '/song' || pathname === '/song.php') {
    const group = parsedUrl.searchParams.get('group') || '';
    const name = parsedUrl.searchParams.get('name') || '';

    if (req.method === 'GET') {
      let song = '';
      let sheet = '';
      const filePath = safeSongPath(group, name, '.txt');
      const snapPath = safeSongPath(group, name, '.html');
      if (filePath && fs.existsSync(filePath)) {
        try { song = fs.readFileSync(filePath, 'utf-8'); } catch (_) {}
      }
      if (snapPath && fs.existsSync(snapPath)) {
        try { sheet = fs.readFileSync(snapPath, 'utf-8'); } catch (_) {}
      }
      const html = renderSongPage(name, group, song, sheet);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    if (req.method === 'POST') {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => {
        try {
          const body = parseBody(req, Buffer.concat(chunks));
          const targetGroup = group || body.group || '';
          const targetName = name || body.name || '';
          const filePath = safeSongPath(targetGroup, targetName, '.txt');
          const snapPath = safeSongPath(targetGroup, targetName, '.html');

          if (!filePath || !snapPath) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Missing or invalid group/name');
            return;
          }

          const dir = path.dirname(filePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          const code = (body.code != null ? String(body.code) : '').replace(/\r/g, '');
          fs.writeFileSync(filePath, code, 'utf-8');
          try { fs.chmodSync(filePath, 0o666); } catch (_) {}

          if (body.sheet != null) {
            fs.writeFileSync(snapPath, String(body.sheet), 'utf-8');
            try { fs.chmodSync(snapPath, 0o666); } catch (_) {}
          }

          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Saved.');
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    if (req.method === 'DELETE') {
      try {
        const filePath = safeSongPath(group, name, '.txt');
        const snapPath = safeSongPath(group, name, '.html');
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
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Deleted.');
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }
  }

  // 3. Static Resources
  if (serveStaticFile(req, res, pathname)) {
    return;
  }

  // 4. 404 Not Found
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`MySheetMusic server running at http://localhost:${PORT}/`);
  });
}

module.exports = server;

