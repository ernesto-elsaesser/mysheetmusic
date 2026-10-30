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

  return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Songs</title>
  <link rel="icon" sizes="any" type="image/svg+xml" href="favicon.svg">
  <style>
  body {
    margin: 8px;
    font-size: 16px;
    line-height: 1.5em;
    background-color: light-dark(#fff, #222);
    color: light-dark(#222, #eee);
    color-scheme: light dark;
  }
  a {
    text-decoration: none;
    color: light-dark(#222, #eee);
  }
  form {
    margin-top: 8px;
  }
  .col {
    width: 200px;
    margin: 8px;
    float: left;
  }
  input[type='text'] {
    width: 140px;
  }
  </style>
</head>

<body>
${colsHtml}</body>
</html>`;
}

function renderSongPage(name, group, songCode, sheetHtml) {
  return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(name)}</title>
    <script src="https://cdn.jsdelivr.net/npm/vexflow@4.2.5/build/cjs/vexflow.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/tone@14.8.49/build/Tone.js"></script>
    <script src="js/parse.js"></script>
    <script src="js/render.js"></script>
    <script src="js/synthesize.js"></script>
    <script src="js/import.js"></script>
    <link rel="stylesheet" href="sheet.css" />
</head>

<body>
    <div id="content">
        <div id="sheet">
            ${sheetHtml}
        </div>
        <div id="editor" hidden>
            <input type="button" onclick="shiftSheet(-7)" value="- OCT" />
            <input type="button" onclick="shiftSheet(-1)" value="- STEP" />
            <input type="button" onclick="shiftSheet(1)" value="+ STEP" />
            <input type="button" onclick="shiftSheet(7)" value="+ OCT" />
            <input type="button" onclick="cancelEdit()" value="CANCEL" />
            <input type="button" onclick="saveSong()" value="SAVE" />
            <textarea id="code">${escapeHtml(songCode)}</textarea>
            <label for="file">MusicXML: </label><input type="file" id="file" accept=".mxl">
            <div id="parts"></div>
        </div>
    </div>
    <div id="footer">
        <select id="scale">
            <option value="C" selected>C Major</option>
            <option value="G">G Major (1#)</option>
            <option value="F">F Major (1b)</option>
            <option value="D">D Major (2#)</option>
            <option value="Bb">Bb Major (2b)</option>
            <option value="A">A Major (3#)</option>
            <option value="Eb">Eb Major (3b)</option>
            <option value="E">E Major (4#)</option>
            <option value="Ab">Ab Major (4b)</option>
        </select>
        |
        <input type="button" onclick="scrollText(-1)" value="&#708;" />
        <input type="button" onclick="scrollText(1)" value="&#709;" />
        |
        <select id="speed">
            <option value="60">60 BPM</option>
            <option value="70">70 BPM</option>
            <option value="80">80 BPM</option>
            <option value="90">90 BPM</option>
            <option value="100" selected>100 BPM</option>
            <option value="110">110 BPM</option>
            <option value="120">120 BPM</option>
            <option value="130">130 BPM</option>
            <option value="140">140 BPM</option>
            <option value="150">150 BPM</option>
            <option value="160">160 BPM</option>
            <option value="180">180 BPM</option>
            <option value="200">200 BPM</option>
        </select>
        <input type="button" onclick="playSong()" value="PLAY" />

        |
        <input type="button" onclick="editSong()" value="EDIT" />
    </div>
    <script>
        const sheet = document.getElementById('sheet')
        const speed = document.getElementById('speed')
        const editor = document.getElementById('editor')
        const footer = document.getElementById('footer')
        const scale = document.getElementById('scale')
        const code = document.getElementById('code')
        const fileInput = document.getElementById('file')
        const parts = document.getElementById('parts')

        var stopPlayback = null
        var isStartingPlayback = false
        var lyricsOffset = 0

        function scrollText(lines) {
            lyricsOffset += lines * 20
            if (lyricsOffset < 0) lyricsOffset = 0
            const textareas = document.getElementsByClassName("lyrics")
            for (let textarea of textareas) {
                textarea.scrollTop = lyricsOffset
            }
        }

        function editSong() {
            sheet.hidden = true
            editor.hidden = false
            footer.hidden = true
        }

        function shiftNotes(song, steps) {

            for (let measure of song) {
                for (let note of measure.notes) {
                    if (note.degree > 0) {
                      note.degree += steps
                      if (note.degree > 7) {
                          note.degree -= 7
                          note.octave += 1
                      } else if (note.degree < 1) {
                          note.degree += 7
                          note.octave -= 1
                      }
                    }
                    if (note.chordDegree > 0) {
                      note.chordDegree += steps
                      if (note.chordDegree > 7) {
                          note.chordDegree -= 7
                      } else if (note.chordDegree < 1) {
                          note.chordDegree += 7
                      }
                    }
                }
            }
        }

        function shiftSheet(steps) {

            const song = decodeSong(code.value)
            shiftNotes(song, steps)
            code.value = encodeSong(song)
        }

        fileInput.addEventListener('change', (event) => {

            const file = event.target.files[0]
            if (file == null) return

            parts.innerHTML = ""

            const parser = new DOMParser()
            const reader = new FileReader()
            reader.onload = async (event) => {
                const array = new Uint8Array(event.target.result)
                const rawReader = new zip.Uint8ArrayReader(array)
                const reader = new zip.ZipReader(rawReader)
                const entries = await reader.getEntries()
                for (let entry of entries) {
                    if (entry.filename.startsWith("META-INF")) continue
                    const writer = new zip.TextWriter()
                    const xml = await entry.getData(writer)
                    const doc = parser.parseFromString(xml, "text/xml")
                    const eparts = doc.getElementsByTagName("part")
                    for (let epart of eparts) {
                        const button = document.createElement("button")
                        button.innerText = epart.id
                        button.onclick = () => importSong(epart)
                        parts.appendChild(button)
                    }
                }
                await reader.close()
            }
            reader.onerror = () => {
                window.alert("Failed to parse " + file.name)
            }
            reader.readAsArrayBuffer(file)
        })

        function importSong(epart) {
            parts.innerHTML = ""
            let song = extractSong(epart, "1")
            code.value = encodeSong(song)
        }

        function cancelEdit() {
            sheet.hidden = false
            editor.hidden = true
            footer.hidden = false
        }

        async function playSong() {

            if (isStartingPlayback) return

            if (stopPlayback == null) {
                isStartingPlayback = true
                try {
                    const bpm = parseFloat(speed.value)
                    const song = decodeSong(code.value)
                    stopPlayback = await synthesizeMelody(song, bpm, () => {
                        stopPlayback = null
                    })
                } finally {
                    isStartingPlayback = false
                }
            } else {
                stopPlayback()
                stopPlayback = null
            }
        }

        async function saveSong() {

            const song = decodeSong(code.value)
            const errors = renderSong(song)

            if (errors != "") {
                window.alert(errors)
                return
            }

            const res = await fetch(window.location.href, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: code.value.replaceAll("\r\n", "\n"),
                    sheet: sheet.innerHTML
                })
            })

            if (res.status == 200) cancelEdit()
            else window.alert(res.statusText)
        }

        function renderSong(song) {

            sheet.innerHTML = ""

            let errors = ""

            for (let i = 0; i < song.length; i += 1) {

                const part = song[i]

                try {

                    const textLengths = part.lyrics.map((l) => l.length)
                    const maxLength = Math.max(part.source.length, ...textLengths)
                    const width = Math.max((maxLength + 1) * 9, 40)

                    const measure = document.createElement("div")
                    measure.className = "measure"
                    measure.style.width = width.toString() + "px"
                    sheet.appendChild(measure)

                    const frame = document.createElement("div")
                    frame.className = "frame"
                    measure.appendChild(frame)
                    renderStave(frame, "black", width, part.notes, scale.value)

                    let lyrics = document.createElement("div")
                    lyrics.className = "lyrics"
                    lyrics.innerHTML = part.lyrics.join("<br>")
                    measure.appendChild(lyrics)

                } catch (error) {
                    errors += part.source + "\n\n" + error.toString() + "\n\n"
                }
            }

            return errors
        }

        scale.addEventListener('change', () => {
            const song = decodeSong(code.value)
            // TODO: UI
            if (scale.value == "G") shiftNotes(song, -7)
            const errors = renderSong(song)
            if (errors != "") window.alert(errors)
        })

    </script>
    <script src="js/zip.js"></script>
</body>
</html>`;
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

