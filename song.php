<!DOCTYPE html>
<html lang="en">

<?php
$method = $_SERVER['REQUEST_METHOD'];
$name = $_GET['name'];
$file = "songs/$name.txt";
$snap = "snaps/$name.txt";

if ($method == 'POST') {
    $code = str_replace("\r", "", $_POST['code']);
    file_put_contents($file, $code);
    $success = chmod($file, 0666);
    if ($success) {
        file_put_contents($snap, $_POST['sheet']);
        $success = chmod($snap, 0666);
    }
    if ($success) {
        echo "Saved.";
    } else {
        $error = error_get_last();
        http_response_code(500);
        echo json_encode($error);
    }
    exit;
} else if ($method == 'DELETE') {
    $success = unlink($file);
    if ($success) {
        echo "Deleted.";
    } else {
        $error = error_get_last();
        http_response_code(500);
        echo json_encode($error);
    }
    exit;
}

$song = "";
if (file_exists($file)) $song = file_get_contents($file);

$sheet = "";
if (file_exists($snap)) $sheet = file_get_contents($snap);
?>

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title><?php echo $name; ?></title>
    <script src="https://cdn.jsdelivr.net/npm/vexflow@4.2.5/build/cjs/vexflow.js"></script>
    <script src="js/parse.js?v=1"></script>
    <script src="js/render.js?v=2"></script>
    <script src="js/synthesize.js?v=2"></script>
    <script src="js/import.js?v=1"></script>
    <link rel="stylesheet" href="style.css?v=1" />
</head>

<body>
    <div id="content">
        <div id="sheet">
            <?php echo $sheet ?>
        </div>
        <div id="editor" hidden>
            <input type="button" onclick="shiftSong(-7)" value="- OCT" />
            <input type="button" onclick="shiftSong(-1)" value="- STEP" />
            <input type="button" onclick="shiftSong(1)" value="+ STEP" />
            <input type="button" onclick="shiftSong(7)" value="+ OCT" />
            <input type="button" onclick="cancelEdit()" value="CANCEL" />
            <input type="button" onclick="saveSong()" value="SAVE" />
            <textarea id="code"><?php echo $song ?></textarea>
            <label for="file">MusicXML: </label><input type="file" id="file" accept=".mxl">
            <div id="parts"></div>
        </div>
    </div>
    <div id="footer">
        <input type="button" onclick="playSong()" value="PLAY" />
        <input type="button" onclick="editSong()" value="EDIT" />
        <input type="button" onclick="scrollText(-1)" value="<" />
        <input type="button" onclick="scrollText(1)" value=">" />
    </ul>
    <script>
        const name = "<?php echo $name ?>"
        const sheet = document.getElementById('sheet')
        const editor = document.getElementById('editor')
        const footer = document.getElementById('footer')
        const code = document.getElementById('code')
        const fileInput = document.getElementById('file')
        const parts = document.getElementById('parts')

        var activeAudioContext = null
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

        function shiftSong(steps) {
            const song = decodeSong(code.value)
            for (let measure of song) {
                for (let note of measure.notes) {
                    note.degree += steps
                    if (note.degree > 7) {
                        note.degree -= 7
                        note.octave += 1
                    } else if (note.degree < 1) {
                        note.degree += 7
                        note.octave -= 1
                    }
                    note.chordDegree += steps
                    if (note.chordDegree > 7) {
                        note.chordDegree -= 7
                    } else if (note.chordDegree < 1) {
                        note.chordDegree += 7
                    }
                }
            }
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

        function playSong() {

            if (activeAudioContext == null) {
                const song = decodeCode(code.value)
                activeAudioContext = synthesizeMelody(song)
            } else {
                activeAudioContext.close()
                activeAudioContext = null
            }
        }

        async function saveSong() {

            const song = decodeCode(code.value)
            const errors = renderSong(song)

            if (errors != "") {
                window.alert(errors)
                return
            }

            const formData = new FormData()
            formData.append('code', code.value.replaceAll("\r\n", "\n"));
            formData.append('sheet', sheet.innerHTML);

            const res = await fetch("song.php?name=" + name, {
                method: 'POST',
                body: formData,
            })

            if (res.status == 200) cancelEdit()
            else window.alert(res.statusText)
        }

        function renderSong(song) {

            sheet.innerHTML = ""

            let errors = ""

            for(let i = 0; i < song.length; i += 1) {

                const part = song[i]

                try {

                    const tieEnd = i + 1 < song.length && song[i + 1].notes[0].isTied
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
                    renderStave(frame, "black", width, part.notes, tieEnd)

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

    </script>
    <script src="js/zip.js"></script>
</body>
</html>
