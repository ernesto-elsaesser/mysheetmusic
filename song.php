<!DOCTYPE html>
<html lang="en">

<?php
$method = $_SERVER['REQUEST_METHOD'];
$name = $_GET['name'];
$file = "songs/$name.txt";
$snap = "snaps/$name.txt";

if ($method == 'POST') {
    file_put_contents($file, $_POST['code']);
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
        echo $error['message'];
    }
    exit;
} else if ($method == 'DELETE') {
    $success = unlink($file);
    if ($success) {
        echo "Deleted.";
    } else {
        $error = error_get_last();
        http_response_code(500);
        echo $error['message'];
    }
    exit;
}

if (!file_exists($file)) {
    http_response_code(404);
    echo "Not found.";
    exit;
}

$song = file_get_contents($file);

$sheet = "";
if (file_exists($snap)) $sheet = file_get_contents($snap);
?>

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title><?php echo $name; ?></title>
    <script src="https://cdn.jsdelivr.net/npm/vexflow@4.2.5/build/cjs/vexflow.js"></script>
    <script src="js/render.js?v=1"></script>
    <script src="js/transpose.js?v=1"></script>
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
        <input type="button" onclick="editSong()" value="EDIT" />
        <input type="button" onclick="prevVerse()" value="<" />
        <input type="button" onclick="nextVerse()" value=">" />
    </ul>
    <script>
        const name = "<?php echo $name ?>"
        const sheet = document.getElementById('sheet')
        const editor = document.getElementById('editor')
        const footer = document.getElementById('footer')
        const code = document.getElementById('code')
        const fileInput = document.getElementById('file')
        const parts = document.getElementById('parts')

        var verse = 1

        function nextVerse() {
            verse += 1
            renderSong()
        }

        function prevVerse() {
            if (verse > 1) verse -= 1
            renderSong()
        }

        function editSong() {
            sheet.hidden = true
            editor.hidden = false
            footer.hidden = true
        }

        function shiftSong(steps) {
            code.value = transposeCode(code.value, steps)
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

        function renderSong() {

            sheet.innerHTML = ""

            const parts = code.value.split("\n\n")
            for(let i = 0; i < parts.length; i += 1) {
                const part = parts[i]
                if (part == "") continue;

                const lines = part.split("\n")
                const melody = lines[0]
                let text = ""
                if (lines.length > 1) {
                    text = lines[Math.min(verse, lines.length - 1)]
                }

                const maxLen = Math.max(melody.length, text.length)
                const width = Math.max((maxLen + 1) * 9, 40)

                let tieEnd = false
                if (i + 1 < parts.length && parts[i + 1][0] == "~") tieEnd = true

                const measure = document.createElement("div")
                measure.className = "measure"
                measure.style.width = width.toString() + "px"

                const frame = document.createElement("div")
                frame.className = "frame"
                const lyrics = document.createElement("div")
                lyrics.className = "lyrics"
                lyrics.innerText = text

                sheet.appendChild(measure)
                measure.appendChild(frame)
                measure.appendChild(lyrics)

                renderMeasure(frame, "black", width, melody, tieEnd)
            }
        }

        function importSong(epart) {
            parts.innerHTML = ""
            code.value = extractCode(epart, "1")
        }

        function cancelEdit() {
            sheet.hidden = false
            editor.hidden = true
            footer.hidden = false
        }

        async function saveSong() {
            renderSong()

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

        function showSnap() {
            window.location.href = "snap.php?name=" + name;
        }
    </script>
    <script src="js/zip.js"></script>
</body>
</html>