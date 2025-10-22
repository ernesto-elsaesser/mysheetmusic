<!DOCTYPE html>
<html lang="en">

<?php
    $name = $_GET['name'];
    $file = "songs/$name.txt";
    $song = "";
    if (file_exists($file)) $song = file_get_contents($file);
?>

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title><?php echo $name; ?></title>
    <script src="js/transpose.js#20250824"></script>
    <script src="js/import.js#20250824"></script>
    <link rel="stylesheet" href="style.css#20250913" />
</head>

<body>
    <div id="content">
        <form id="editor" method="POST" action="<?php echo "song.php?name=$name"; ?>">
            <input type="button" onclick="shiftSong(-7)" value="- OCT" />
            <input type="button" onclick="shiftSong(-1)" value="- STEP" />
            <input type="button" onclick="shiftSong(1)" value="+ STEP" />
            <input type="button" onclick="shiftSong(7)" value="+ OCT" />
            <input type="submit" value="SAVE" />
            <a href="<?php echo "song.php?name=$name"; ?>">VIEW</a>
            <textarea id="code"><?php echo $song; ?></textarea>
        </form>
        <label for="file">MusicXML: </label><input type="file" id="file" accept=".mxl">
        <div id="parts"></div>
    </div>
    <script>
        const code = document.getElementById('code')
        const fileInput = document.getElementById('file')
        const parts = document.getElementById('parts')

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

        function importSong(epart) {
            parts.innerHTML = ""
            code.value = extractCode(epart, "1")
        }
    </script>
    <script src="js/zip.js"></script>
</body>
</html>