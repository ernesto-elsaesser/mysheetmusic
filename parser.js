const A4_DELTAS = [null, -9/12, -7/12, -5/12, -4/12, -2/12, 0, 2/12]
const DURATION_FACTORS = {
    "w": 4.0,
    "h": 2.0,
    "q": 1.0,
    "o": 0.5,
    "x": 0.25,
    "z": 0.125,
}
const CHORD_STEPS = {
    "": [0, 4/12, 7/12],
    "7": [0, 4/12, 7/12, 10/12],
    "m": [0, 3/12, 7/12],
    "m7": [0, 3/12, 7/12, 10/12],
    "dim": [0, 3/12, 6/12],
    "sus": [0, 5/12, 7/12],
}


function decodeSong(code) {

    return code.split("\n\n").map((measure) => {

        let lyrics = measure.split("\n")
        const melody = lyrics.shift()
        let notes = []
        let size = 0

        for (let token of melody.split(" ")) {

            if (token == "") break
            if (token == "|") continue

            let note = {
                tie: false,
                deg: 0,
                oct: 4,
                acc: "",
                dur: "",
                dot: 0,
                tri: false,
                crd: null,
            }

            const data = token.split("")

            if (data[0] == "~") {
                note.tie = true
                data.shift()
            }

            note.deg = parseInt(data.shift())
            while (data[0] == "'") {
                data.shift()
                note.oct += 1
            }
            while (data[0] == ",") {
                data.shift()
                note.oct -= 1
            }

            if (data[0] == "#") {
                note.acc = "#"
                data.shift()
                size += 1
            } else if (data[0] == "b") {
                note.acc = "b"
                data.shift()
                size += 1
            }

            note.dur = data.shift()

            while (data[0] == ".") {
                note.dot += 1
                data.shift()
            }

            if (data[0] == "t") {
                data.shift()
                note.tri = true
            }

            notes.push(note)

            size += 2 + note.acc.length + note.dot

            if (data.length == 0) continue

            const chordDegree = parseInt(data.shift())

            let chordAcc = ""
            if (data[0] == "#") {
                chordAcc = "#"
                data.shift()
            }
            else if (data[0] == "b") {
                chordAcc = "b"
                data.shift()
            }

            const chordMod = data.join("")
            
            note.crd = {deg: chordDegree, acc: chordAcc, mod: chordMod}
        }

        return {notes, lyrics, size}

    }).filter((l) => l.notes.length > 0)
}

function extractMelody(song) {

    let sounds = []
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

            if (note.tie && (note.deg == prevNote.deg) && (note.oct == prevNote.oct)) {
                pendingLength += length
                continue
            }

            length += pendingLength
            pendingLength = 0

            if (note.deg > 0) {
                const level = getA4Shift(note.deg, note.oct, note.acc)
                sounds.push({
                    level: level,
                    gain: 0.3,
                    offset: offset,
                    length: length,
                })
            }

            if (note.crd) {
                if (prevChord != null) {
                    prevChord.forEach(s => s.length = offset - s.offset)
                }
                const level = getA4Shift(note.crd.deg, 3, note.crd.acc)
                const chordSounds = CHORD_STEPS[note.crd.mod].map(step => {
                    return {
                        level: level + step,
                        gain: 0.1,
                        offset: offset,
                        length: 0, // set later
                    }
                })
                sounds.push(...chordSounds)
                prevChord = chordSounds
            }

            prevNote = note

            offset += length
        }
    }

    if (prevChord != null) {
        prevChord.forEach(s => {
            s.length = offset - s.offset
            s.offsetEnd = offset
        })
    }

    return sounds
}

function getA4Shift(degree, octave, accidental) {

    let exp = A4_DELTAS[degree] + (octave - 4)
    if (accidental == "#") exp += 1/12
    else if (accidental == "b") exp -= 1/12
    return exp
}

module.exports = {
    decodeSong,
    extractMelody,
};
