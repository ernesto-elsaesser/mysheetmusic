const A4_DELTAS = [null, -9/12, -7/12, -5/12, -4/12, -2/12, 0, 2/12]
const DURATION_FACTORS = {
    "w": 4.0,
    "h": 2.0,
    "q": 1.0,
    "o": 0.5,
    "x": 0.25,
    "z": 0.125,
}
const TEMPO = 0.5

// TODO: ties, chords, triplets

function synthesizeMelody(song) {

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    let startTime = audioCtx.currentTime

    song.forEach((part) => {
        part.notes.forEach((note) => {

            let factor = DURATION_FACTORS[note.duration]
            if (note.dots == 1) factor *= 1.5
            else if (note.dots == 2) factor *= 1.75

            const endTime = startTime + TEMPO * factor

            if (note.degree > 0) {
                let exp = A4_DELTAS[note.degree]
                exp += note.octave - 4
                if (note.accs == "#") exp += 1/12
                else if (note.accs == "b") exp -= 1/12
                const frequency = 440 * Math.pow(2, exp)
                const osc = audioCtx.createOscillator()
                osc.frequency.setValueAtTime(frequency, startTime)
                
                // envelope
                const gain = audioCtx.createGain()
                gain.gain.setValueAtTime(0, startTime)
                gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02)
                gain.gain.exponentialRampToValueAtTime(0.0001, endTime)

                osc.connect(gain)
                gain.connect(audioCtx.destination)

                osc.start(startTime)
                osc.stop(endTime)
            }
            startTime = endTime
        })
    })

    return audioCtx
}
