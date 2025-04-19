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
    32: "w",
    24: "h.",
    16: "h",
    12: "q.",
    8: "q",
    6: "o.",
    4: "o",
    3: "x.",
    2: "x",
    1: "z",
}

const CONNECTORS = {
    "single": " ",
    "begin": " ",
    "middle": "",
    "end": "",
}

function extractCode(epart, voice) {

    const emeasures = epart.getElementsByTagName("measure")

    var baseLength = 2
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
                baseLength = parseInt(edivisions.innerHTML) / 2
            }
        }

        // TODO parse <harmony> for chords

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
                var degree = PITCHES.indexOf(step) + 1 - downshift
                var octave = parseInt(eoctave.innerHTML)
                const alter = ealter ? parseInt(ealter.innerHTML ?? "0") : 0
                
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

            const length = parseInt(eduration.innerHTML) * baseLength
            var duration = DURATIONS[length]
            if (duration == undefined) {
                duration = "?"
                const edot = enote.getElementsByTagName("dot")[0]
                if (edot) duration += "."
                console.log("ERROR: UNMAPPED DURATION", eduration)
            }
            code += duration

            const etie = enote.getElementsByTagName("tie")[0]
            if (etie) {
                const type = etie.attributes["type"].nodeValue
                if (type == "stop") code = "~" + code
            }

            // TODO: <time-modification> for triplets

            notes.push(code)

            const elyrics = enote.getElementsByTagName("lyric")
            while (elyrics.length > lines.length) lines.push("")
            for (let elyric of elyrics) {
                const index = parseInt(elyric.attributes["number"].nodeValue) - 1
                const syllabic = elyric.getElementsByTagName("syllabic")[0].innerHTML
                var text = elyric.getElementsByTagName("text")[0].innerHTML
                if (lines[index]) lines[index] += CONNECTORS[syllabic] + text
                else lines[index] = text
            }
        }

        const melody = notes.join(" ")
        lines.unshift(melody)
        measures.push(lines)
    }

    return measures.map((m) => m.join("\n")).join("\n\n")
}

function transposeCode(code, up) {

    let measures = code.split("\n\n")

    for (let i = 0; i < measures.length; i += 1) {
        let measure = measures[i]
        if (measure == "") continue
        let lines = measure.split("\n")
        let notes = lines[0].split(" ")
        notes = notes.map((note) => {
            let head = note.slice(0, 1)
            if (head == "0") return note
            let mark = note.slice(1, 2)
            let tail = note.slice(2)
            if(head == "~") {
                head = note.slice(0, 2)
                mark = note.slice(2, 3)
                tail = note.slice(3)
            }
            if (up && mark != ",") head += "'" + mark
            if (!up && mark != "'") head += "," + mark
            return head + tail
        })
        lines[0] = notes.join(" ")
        measures[i] = lines.join("\n")
    }

    return measures.join("\n\n")
}
