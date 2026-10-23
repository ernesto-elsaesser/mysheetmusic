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

// TODO: slurs

const PIANO_SAMPLES = {
    A0: "A0.mp3",
    C1: "C1.mp3",
    "D#1": "Ds1.mp3",
    "F#1": "Fs1.mp3",
    A1: "A1.mp3",
    C2: "C2.mp3",
    "D#2": "Ds2.mp3",
    "F#2": "Fs2.mp3",
    A2: "A2.mp3",
    C3: "C3.mp3",
    "D#3": "Ds3.mp3",
    "F#3": "Fs3.mp3",
    A3: "A3.mp3",
    C4: "C4.mp3",
    "D#4": "Ds4.mp3",
    "F#4": "Fs4.mp3",
    A4: "A4.mp3",
    C5: "C5.mp3",
    "D#5": "Ds5.mp3",
    "F#5": "Fs5.mp3",
    A5: "A5.mp3",
    C6: "C6.mp3",
    "D#6": "Ds6.mp3",
    "F#6": "Fs6.mp3",
    A6: "A6.mp3",
    C7: "C7.mp3",
    "D#7": "Ds7.mp3",
    "F#7": "Fs7.mp3",
    A7: "A7.mp3",
    C8: "C8.mp3"
}

let pianoSampler = null

function getPianoSampler() {
    if (!pianoSampler) {
        pianoSampler = new Tone.Sampler({
            urls: PIANO_SAMPLES,
            baseUrl: "assets/piano/",
            release: 1
        }).toDestination()
    }
    return pianoSampler
}

async function synthesizeMelody(song, bpm, onFinished) {

    await Tone.start()
    getPianoSampler()
    await Tone.loaded()

    const sounds = extractMelody(song)
    return playMelody(sounds, bpm, onFinished)
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
                    gain: 0.3,
                    offset: offset,
                    length: length,
                })
            }

            if (note.chordDegree > 0) {
                if (prevChord != null) {
                    prevChord.forEach(s => s.length = offset - s.offset)
                }
                const level = getA4Shift(note.chordDegree, 3, note.chordAcc)
                const chordSounds = CHORD_STEPS[note.chordSuffix].map(step => {
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

function playMelody(sounds, bpm, onFinished) {

    Tone.Transport.stop()
    Tone.Transport.cancel()
    Tone.Transport.position = 0
    Tone.Transport.bpm.value = bpm

    const secondsPerBeat = 60 / bpm
    const sampler = getPianoSampler()
    let maxEnd = 0

    sounds.forEach(sound => {
        const midi = 69 + Math.round(sound.level * 12)
        const note = Tone.Frequency(midi, "midi").toNote()
        const timeOffset = sound.offset * secondsPerBeat
        const soundLength = sound.length > 0 ? sound.length : (sound.offsetEnd ? sound.offsetEnd - sound.offset : 1.0)
        const duration = Math.max(0.1, soundLength * secondsPerBeat)
        const velocity = Math.min(1, (sound.gain || 0.3) * 2.5)

        Tone.Transport.schedule(time => {
            sampler.triggerAttackRelease(note, duration, time, velocity)
        }, timeOffset)

        const noteEnd = timeOffset + duration
        if (noteEnd > maxEnd) {
            maxEnd = noteEnd
        }
    })

    const stopPlayback = () => {
        Tone.Transport.stop()
        Tone.Transport.cancel()
        sampler.releaseAll()
    }

    Tone.Transport.schedule(() => {
        stopPlayback()
        if (typeof onFinished === "function") {
            onFinished()
        }
    }, maxEnd + 0.5)

    Tone.Transport.start()

    return stopPlayback
}

function getA4Shift(degree, octave, acc) {

    let exp = A4_DELTAS[degree] + (octave - 4)
    if (acc == "#") exp += 1/12
    else if (acc == "b") exp -= 1/12
    return exp
}
