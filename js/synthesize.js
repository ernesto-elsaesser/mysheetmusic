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
    "m": [0, 3/12, 7/12],
    "sus": [0, 5/12, 7/12],
}
const TEMPO = 0.5

// TODO: slurs

function synthesizeMelody(song) {

    const sounds = extractMelody(song)
    return playMelody(sounds, TEMPO)
}

function extractMelody(song) {

    let sounds = []
    let offset = 0
    let prevChord = null

    for (let part of song) {
        let pendingLength = 0
        for (let note of part.notes) {

            let length = DURATION_FACTORS[note.duration]
            if (note.inTriplet) length *= 2/3
            if (note.dots == 1) length *= 1.5
            else if (note.dots == 2) length *= 1.75

            if (note.transTo && (note.transTo.degree == note.degree) && (note.transTo.octave == note.octave)) {
                pendingLength += length
                continue
            }

            length += pendingLength
            pendingLength = 0

            if (note.degree > 0) {
                const level = getA4Shift(note.degree, note.octave, note.acc)
                sounds.push({
                    level: level,
                    gain: 0.1,
                    offsetStart: offset,
                    offsetEnd: offset + length,
                })
            }

            if (note.chordDegree > 0) {
                if (prevChord != null) {
                    prevChord.forEach(s => s.offsetEnd = offset)
                }
                const level = getA4Shift(note.chordDegree, 3, note.chordAcc)
                const chordSounds = CHORD_STEPS[note.chordSuffix].map(step => {
                    return {
                        level: level + step,
                        gain: 0.03,
                        offsetStart: offset,
                        offsetEnd: null, // set later
                    }
                })
                sounds.push(...chordSounds)
                prevChord = chordSounds
            }

            offset += length
        }
    }

    if (prevChord != null) {
        prevChord.forEach(s => s.offsetEnd = offset)
    }

    return sounds
}

function playMelody(sounds, tempo) {

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    let now = audioCtx.currentTime

    sounds.forEach(sound => {
        const start = now + tempo * sound.offsetStart
        const end = now + tempo * sound.offsetEnd

        // envelope
        const gainNode = audioCtx.createGain()
        gainNode.gain.setValueAtTime(0, start)
        gainNode.gain.linearRampToValueAtTime(sound.gain, start + 0.02)
        gainNode.gain.setValueAtTime(sound.gain, end - 0.2)
        gainNode.gain.linearRampToValueAtTime(0, end)
        gainNode.connect(audioCtx.destination)

        const osc = audioCtx.createOscillator()
        const frequency = 440 * Math.pow(2, sound.level)
        osc.frequency.setValueAtTime(frequency, start)
        
        osc.connect(gainNode)
        osc.start(start)
        osc.stop(end)
    })

    return audioCtx
}

function getA4Shift(degree, octave, acc) {

    let exp = A4_DELTAS[degree] + (octave - 4)
    if (acc == "#") exp += 1/12
    else if (acc == "b") exp -= 1/12
    return exp
}

function addNote(context, a4Shift, start, end) {

}