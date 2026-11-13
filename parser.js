const MAJOR_STEPS = {
    "1": 0,
    "2": 2,
    "3": 4,
    "4": 5,
    "5": 7,
    "6": 9,
    "7": 11,
}

const DURATION_FACTORS = {
    "w": 4.0,
    "h": 2.0,
    "q": 1.0,
    "o": 0.5,
    "x": 0.25,
    "z": 0.125,
}

const CHORD_STEPS = {
    "": [0, 4, 7],
    "7": [0, 4, 7, 10],
    "m": [0, 3, 7],
    "m7": [0, 3, 7, 10],
    "dim": [0, 3, 6],
    "sus": [0, 5, 7],
}


function parseDegree(scaleDegree) {
    return MAJOR_STEPS[scaleDegree] 
}


function decodeSong(code) {

    return code.split("\n\n").map((measure) => {

        let lyrics = measure.split("\n")
        const melody = lyrics.shift()
        let notes = []

        for (let token of melody.split(" ")) {

            if (token == "") break
            if (token == "|") continue

            let note = {oct: 0}

            const data = token.split("")

            if (data[0] == "~") {
                note.tie = true
                data.shift()
            }

            note.val = parseDegree(data.shift())

            while (data[0] == "'") {
                data.shift()
                note.oct += 1
            }
            while (data[0] == ",") {
                data.shift()
                note.oct -= 1
            }

            if (data[0] == "#") {
                note.val += 1
                if (note.val == 12) {
                  note.val = 0
                  octave += 1
                }
                data.shift()
            } else if (data[0] == "b") {
                note.val -= 1
                if (note.val == -1) {
                  note.val = 11
                  octave -= 1
                }
                data.shift()
            }

            note.dur = data.shift()

            if (data[0] == ".") {
                note.dot = 1
                data.shift()
                if (data[0] == ".") {
                    note.dot = 2
                    data.shift()
                }
            }

            if (data[0] == "t") {
                data.shift()
                note.tri = true
            }

            notes.push(note)

            if (data.length == 0) continue

            note.crd = {val: parseDegree(data.shift())}

            if (data[0] == "#") {
                note.crd.val += 1
                if (note.crd.val == 12) note.crd.val = 0
                data.shift()
            }
            else if (data[0] == "b") {
                note.crd.val -= 1
                if (note.crd.val == -1) note.crd.val = 11
                data.shift()
            }

            note.crd.mod = data.join("")
        }

        return {notes, lyrics}

    }).filter((l) => l.notes.length > 0)
}

function extractSounds(song) {

    let melody = []
    let harmony = []
    let offset = 0
    let prevNote = null
    let prevChord = null

    for (let part of song) {
        let pendingLength = 0
        for (let note of part.notes) {

            let length = DURATION_FACTORS[note.dur]
            if (note.tri) length *= 2/3
            if (note.dot == 1) length *= 1.5
            else if (note.dot == 2) length *= 1.75

            if (note.tie && (note.val == prevNote.val) && (note.oct == prevNote.oct)) {
                pendingLength += length
                continue
            }

            length += pendingLength
            pendingLength = 0

            if (note.val != null) {
                const pitch = (note.oct * 12) + note.val
                melody.push([pitch, offset, length])
            }

            if (note.crd) {
                if (prevChord) prevChord.forEach(c => c[2] = offset - c[1])
                const chordSteps = CHORD_STEPS[note.crd.mod] || [0]
                const chord = chordSteps.map(shift => {
                    const pitch = note.crd.val + shift - 12
                    return [pitch, offset, 0] // length set later
                })
                harmony.push(...chord)
                prevChord = chord
            }

            prevNote = note

            offset += length
        }
    }

    if (prevChord) prevChord.forEach(c => c[2] = offset - c[1])

    return {melody, harmony}
}

module.exports = {
    decodeSong,
    extractSounds,
};
