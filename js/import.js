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
    "-5": 1,
    "-4": 5,
    "-3": 2,
    "-2": 6,
    "-1": 3,
    "0": 0,
    "1": 4,
    "2": 1,
    "3": 5,
    "4": 2,
    "5": 6,
}

const DURATIONS = {
    96: "w",
    84: "h..",
    72: "h.",
    48: "h",
    42: "q..",
    36: "q.",
    24: "q",
    18: "o.",
    16: "qt",
    12: "o",
    9: "x.",
    8: "ot",
    6: "x",
    4: "xt",
    3: "z",
}

const INFIXES = {
    "single": " ",
    "begin": "-",
    "middle": "-",
    "end": " ",
}

function parseNote(step, octave, alter, fifths) {

    if (fifths < 0 && alter == -1 && step == "B") alter = 0
    if (fifths < 1 && alter == -1 && step == "E") alter = 0
    if (fifths < 2 && alter == -1 && step == "A") alter = 0
    if (fifths < 3 && alter == -1 && step == "D") alter = 0
    if (fifths < 4 && alter == -1 && step == "G") alter = 0

    if (fifths > 0 && alter == 1 && step == "F") alter = 0
    if (fifths > 1 && alter == 1 && step == "C") alter = 0
    if (fifths > 2 && alter == 1 && step == "G") alter = 0
    if (fifths > 3 && alter == 1 && step == "D") alter = 0
    if (fifths > 4 && alter == 1 && step == "A") alter = 0

    let degree = PITCHES.indexOf(step) + 1 - DOWNSHIFTS[fifths]
    
    let acc = ""
    if (alter != 0) {
        acc = "#"
        if (alter == -1) degree -= 1
    }
    if (degree < 1) {
        degree += 7
        octave -= 1
    }
    return {
        degree: degree,
        octave: octave,
        acc: acc,
    }
}

function extractSong(epart, voice) {

    const emeasures = epart.getElementsByTagName("measure")

    let baseLength = 6
    let fifths = 0
    let song = []
    let prevNote = null
    for (const emeasure of emeasures) {

        const eattr = emeasure.getElementsByTagName("attributes")[0]
        if (eattr) {
            const ekey = eattr.getElementsByTagName("key")[0]
            if (ekey) {
                const efifths = ekey.getElementsByTagName("fifths")[0]
                fifths = parseInt(efifths.innerHTML)
            }
            const edivisions = eattr.getElementsByTagName("divisions")[0]
            if (edivisions) {
                baseLength = 24 / parseInt(edivisions.innerHTML)
            }
        }

        let notes = []
        let lyrics = []
        let chord = null
        let inSlur = false
        for (const node of emeasure.childNodes) {

            if (node.tagName == "harmony") {
                const eoffset = node.getElementsByTagName("offset")[0]
                if (eoffset) {
                    console.log("WARNING: HARMONY OFFSET", emeasure)
                    continue
                }
                const eroot = node.getElementsByTagName("root")[0]
                const estep = eroot.getElementsByTagName("root-step")[0]
                const ealter = eroot.getElementsByTagName("root-alter")[0]
                const ekind = node.getElementsByTagName("kind")[0]
                const alter = ealter ? parseInt(ealter.innerHTML) : 0
                chord = parseNote(estep.innerHTML, 0, alter, fifths)
                if (ekind.innerHTML == "minor") chord.suffix += "m"
                else chord.suffix = ""
                continue
            }

            if (node.tagName != "note") continue;

            const echord = node.getElementsByTagName("chord")[0]
            if (echord) continue

            const estaff = node.getElementsByTagName("staff")[0]
            if (estaff && estaff.innerHTML != "1") continue

            const evoice = node.getElementsByTagName("voice")[0]
            if (evoice.innerHTML != voice) continue

            const eduration = node.getElementsByTagName("duration")[0]
            if (eduration == undefined) continue

            let note = {
                degree: 0,
                octave: 4,
                duration: "",
                acc: "",
                dots: 0,
                transFrom: null,
                transTo: null,
                inTriplet: false,
                chordDegree: 0,
                chordAcc: "",
                chordSuffix: "",
            }

            const epitch = node.getElementsByTagName("pitch")[0]
            if (epitch == undefined) {
                const erest = node.getElementsByTagName("rest")[0]
                if (erest == undefined) {
                    console.log("ERROR: NO REST", node)
                }
            } else {
                const estep = epitch.getElementsByTagName("step")[0]
                const eoctave = epitch.getElementsByTagName("octave")[0]
                const ealter = node.getElementsByTagName("alter")[0]

                const octave = parseInt(eoctave.innerHTML)
                const alter = ealter ? parseInt(ealter.innerHTML) : 0
                const info = parseNote(estep.innerHTML, octave, alter, fifths)

                note.degree = info.degree
                note.octave = info.octave
                note.acc = info.acc
            }

            const length = parseInt(eduration.innerHTML) * baseLength
            let duration = DURATIONS[length]
            if (duration == undefined) {
                note.duration = "?"
                const edot = node.getElementsByTagName("dot")[0]
                if (edot) note.dots = 1
                console.log("ERROR: UNMAPPED DURATION " + length, node)
            } else {
                note.duration = duration[0]
                if (duration.includes("t")) notes.inTriplet = true
                else note.dots = duration.length - 1
            }

            let isTied = inSlur

            const enotations = node.getElementsByTagName("notations")[0]
            if (enotations) {
                const eslur = enotations.getElementsByTagName("slur")[0]
                if (eslur) {
                    const type = eslur.attributes["type"].nodeValue
                    if (type == "start") inSlur = true
                    else if (type == "stop") inSlur = false
                }
            }

            const etie = node.getElementsByTagName("tie")[0]
            if (etie) {
                const type = etie.attributes["type"].nodeValue
                if (type == "stop") isTied = true
            }

            if (isTied) {
                note.transFrom = prevNote
                prevNote.transTo = note
            }

            if (chord) {
                note.chordDegree = chord.degree
                note.chordAcc = chord.acc
                note.chordSuffix = chord.suffix
                chord = null
            }

            notes.push(note)
            prevNote = note

            const elyrics = node.getElementsByTagName("lyric")
            for (const elyric of elyrics) {
                const index = parseInt(elyric.attributes["number"].nodeValue) - 1
                const syllabic = elyric.getElementsByTagName("syllabic")[0].innerHTML
                const text = elyric.getElementsByTagName("text")[0].innerHTML
                while (index >= lyrics.length) lyrics.push("")
                let line = lyrics[index]
                if (line.endsWith("-")) line = line.slice(0, -1)
                line += text
                line += INFIXES[syllabic]
                lyrics[index] = line.trim()
            }
        }

        song.push({notes: notes, lyrics: lyrics})
    }

    return song
}
