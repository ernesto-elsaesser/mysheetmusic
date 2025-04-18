const PITCHES = [
    "C",
    "D",
    "E",
    "F",
    "G",
    "A",
    "B",
]

const DOWNSHIFTS = {
    "-1": 3,
    "0": 0,
    "1": 4,
}

const OCTAVES = {
    2: ",,",
    3: ",",
    4: "",
    5: "'",
    6: "''",
}

const DURATIONS = {
    1: "w",
    2: "h",
    3: "h.",
    4: "q",
    6: "q.",
    8: "o",
    12: "o.",
    16: "x",
    32: "z",
}

const CONNECTORS = {
    "single": " ",
    "begin": " ",
    "middle": "",
    "end": "",
}

function importMXL(file, part, voice, title, onUpdate) {

    onUpdate("extracting ...")

    const reader = new FileReader()
    reader.onload = async (event) => {
        const array = new Uint8Array(event.target.result)
        const rawReader = new zip.Uint8ArrayReader(array)
        const reader = new zip.ZipReader(rawReader)
        const entries = await reader.getEntries()
        for (let entry of entries) {
            if (entry.filename != "score.xml") continue;
            const writer = new zip.TextWriter()
            const xml = await entry.getData(writer)
            onUpdate("parsing ...")
            const result = parseXML(xml, part, voice)
            onUpdate(result)
        }
        await reader.close();
    };
    reader.onerror = () => {
        onUpdate("Error reading file.")
    };
    reader.readAsArrayBuffer(file)
}

function parseXML(xml, part, voice) {

    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, "text/xml")

    const eparts = doc.getElementsByTagName("part")
    const epart = eparts[part - 1]

    const emeasures = epart.getElementsByTagName("measure")

    var whole = 4
    var downshift = 0
    var measures = []
    for (let emeasure of emeasures) {

        const eattr = emeasure.getElementsByTagName("attributes")[0]
        if (eattr) {
            const ekey = eattr.getElementsByTagName("key")[0]
            if (ekey) {
                if (measures.length > 0) {
                    console.log("ERROR: SECOND KEY", emeasure)
                }
                const fifths = ekey.getElementsByTagName("fifths")[0]
                downshift = DOWNSHIFTS[fifths.innerHTML]
            }
            const edivisions = eattr.getElementsByTagName("divisions")[0]
            if (edivisions) {
                whole = parseInt(edivisions.innerHTML) * 4
            }
        }

        // TODO parse <harmony>

        var notes = []
        var lines = []
        const enotes = emeasure.getElementsByTagName("note")
        for (let enote of enotes) {

            const echord = enote.getElementsByTagName("chord")[0]
            if (echord) continue

            const estaff = enote.getElementsByTagName("staff")[0]
            if (estaff && estaff.innerHTML != "1") continue

            const evoice = enote.getElementsByTagName("voice")[0]
            if (evoice.innerHTML != voice) continue

            const eduration = enote.getElementsByTagName("duration")[0]
            if (eduration == undefined) continue

            const epitch = enote.getElementsByTagName("pitch")[0]
            var code = "0"
            if (epitch == undefined) {
                const erest = enote.getElementsByTagName("rest")[0]
                if (erest == undefined) {
                    console.log("ERROR: NO REST", enote)
                }
            } else {
                const estep = epitch.getElementsByTagName("step")[0]
                const eoctave = epitch.getElementsByTagName("octave")[0]
                const ealter = enote.getElementsByTagName("alter")[0]

                const step = estep.innerHTML
                const octave = parseInt(eoctave.innerHTML)
                const alter = ealter ? parseInt(ealter.innerHTML ?? "0") : 0
                
                var degree = PITCHES.indexOf(step) + 1 - downshift
                var modifier = ""
                if (alter != 0) {
                    modifier = "#"
                    if (alter == -1) degree -= 1
                }
                if (degree < 1) {
                    degree += 7
                    octave -= 1
                }
                code = degree.toString() + modifier + OCTAVES[octave]
            }

            const duration = whole / parseInt(eduration.innerHTML)
            code += DURATIONS[duration]

            const etie = enote.getElementsByTagName("tie")[0]
            if (etie) {
                const type = etie.attributes["type"].nodeValue
                if (type == "stop") code = "~" + code
            }

            notes.push(code)
            const elyrics = enote.getElementsByTagName("lyric")
            if (lines.length == 0) {
                lines = Array.from(elyrics).map(function(elyric) {
                    const text = elyric.getElementsByTagName("text")[0].innerHTML
                    return text
                })
            } else {
                for (var i = 0; i < elyrics.length; i += 1) {
                    const elyric = elyrics[i]
                    const syllabic = elyric.getElementsByTagName("syllabic")[0].innerHTML
                    const text = elyric.getElementsByTagName("text")[0].innerHTML
                    lines[i] += CONNECTORS[syllabic] + text
                }
            }
        }

        const melody = notes.join(" ")
        lines.unshift(melody)
        measures.push(lines)
    }

    return measures.map((m) => m.join("\n")).join("\n\n")
}
