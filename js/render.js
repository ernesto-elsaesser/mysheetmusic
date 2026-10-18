const SHIFTS = {  // up step | up octave offset | down step | down octave offset
    "c": ["d", 0, "b", 1],
    "d": ["e", 0, "c", 0],
    "e": ["f", 0, "d", 0],
    "f": ["g", 0, "e", 0],
    "g": ["a", 0, "f", 0],
    "a": ["b", 0, "g", 0],
    "b": ["c", 1, "a", 0],
}

const MAJOR_SCALES = {
    "C": [
        null,
        { step: "c", acc: "", chord: "C", octaveOffset: 0 },
        { step: "d", acc: "", chord: "D", octaveOffset: 0 },
        { step: "e", acc: "", chord: "E", octaveOffset: 0 },
        { step: "f", acc: "", chord: "F", octaveOffset: 0 },
        { step: "g", acc: "", chord: "G", octaveOffset: 0 },
        { step: "a", acc: "", chord: "A", octaveOffset: 0 },
        { step: "b", acc: "", chord: "B", octaveOffset: 0 },
    ],
    "Db": [
        null,
        { step: "d", acc: "b", chord: "Db", octaveOffset: 0 },
        { step: "e", acc: "b", chord: "Eb", octaveOffset: 0 },
        { step: "f", acc: "", chord: "F", octaveOffset: 0 },
        { step: "g", acc: "b", chord: "Gb", octaveOffset: 0 },
        { step: "a", acc: "b", chord: "Ab", octaveOffset: 0 },
        { step: "b", acc: "b", chord: "Bb", octaveOffset: 0 },
        { step: "c", acc: "", chord: "C", octaveOffset: 1 },
    ],
    "D": [
        null,
        { step: "d", acc: "", chord: "D", octaveOffset: 0 },
        { step: "e", acc: "", chord: "E", octaveOffset: 0 },
        { step: "f", acc: "#", chord: "F#", octaveOffset: 0 },
        { step: "g", acc: "", chord: "G", octaveOffset: 0 },
        { step: "a", acc: "", chord: "A", octaveOffset: 0 },
        { step: "b", acc: "", chord: "B", octaveOffset: 0 },
        { step: "c", acc: "#", chord: "C#", octaveOffset: 1 },
    ],
    "Eb": [
        null,
        { step: "e", acc: "b", chord: "Eb", octaveOffset: 0 },
        { step: "f", acc: "", chord: "F", octaveOffset: 0 },
        { step: "g", acc: "", chord: "G", octaveOffset: 0 },
        { step: "a", acc: "b", chord: "Ab", octaveOffset: 0 },
        { step: "b", acc: "b", chord: "Bb", octaveOffset: 0 },
        { step: "c", acc: "", chord: "C", octaveOffset: 1 },
        { step: "d", acc: "", chord: "D", octaveOffset: 1 },
    ],
    "E": [
        null,
        { step: "e", acc: "", chord: "E", octaveOffset: 0 },
        { step: "f", acc: "#", chord: "F#", octaveOffset: 0 },
        { step: "g", acc: "#", chord: "G#", octaveOffset: 0 },
        { step: "a", acc: "", chord: "A", octaveOffset: 0 },
        { step: "b", acc: "", chord: "B", octaveOffset: 0 },
        { step: "c", acc: "#", chord: "C#", octaveOffset: 1 },
        { step: "d", acc: "#", chord: "D#", octaveOffset: 1 },
    ],
    "F": [
        null,
        { step: "f", acc: "", chord: "F", octaveOffset: 0 },
        { step: "g", acc: "", chord: "G", octaveOffset: 0 },
        { step: "a", acc: "", chord: "A", octaveOffset: 0 },
        { step: "b", acc: "b", chord: "Bb", octaveOffset: 0 },
        { step: "c", acc: "", chord: "C", octaveOffset: 1 },
        { step: "d", acc: "", chord: "D", octaveOffset: 1 },
        { step: "e", acc: "", chord: "E", octaveOffset: 1 },
    ],
    "F#": [
        null,
        { step: "f", acc: "#", chord: "F#", octaveOffset: 0 },
        { step: "g", acc: "#", chord: "G#", octaveOffset: 0 },
        { step: "a", acc: "#", chord: "A#", octaveOffset: 0 },
        { step: "b", acc: "", chord: "B", octaveOffset: 0 },
        { step: "c", acc: "#", chord: "C#", octaveOffset: 1 },
        { step: "d", acc: "#", chord: "D#", octaveOffset: 1 },
        { step: "e", acc: "#", chord: "E#", octaveOffset: 1 },
    ],
    "Gb": [
        null,
        { step: "g", acc: "b", chord: "Gb", octaveOffset: 0 },
        { step: "a", acc: "b", chord: "Ab", octaveOffset: 0 },
        { step: "b", acc: "b", chord: "Bb", octaveOffset: 0 },
        { step: "c", acc: "b", chord: "Cb", octaveOffset: 1 },
        { step: "d", acc: "b", chord: "Db", octaveOffset: 1 },
        { step: "e", acc: "b", chord: "Eb", octaveOffset: 1 },
        { step: "f", acc: "", chord: "F", octaveOffset: 1 },
    ],
    "G": [
        null,
        { step: "g", acc: "", chord: "G", octaveOffset: 0 },
        { step: "a", acc: "", chord: "A", octaveOffset: 0 },
        { step: "b", acc: "", chord: "B", octaveOffset: 0 },
        { step: "c", acc: "", chord: "C", octaveOffset: 1 },
        { step: "d", acc: "", chord: "D", octaveOffset: 1 },
        { step: "e", acc: "", chord: "E", octaveOffset: 1 },
        { step: "f", acc: "#", chord: "F#", octaveOffset: 1 },
    ],
    "Ab": [
        null,
        { step: "a", acc: "b", chord: "Ab", octaveOffset: 0 },
        { step: "b", acc: "b", chord: "Bb", octaveOffset: 0 },
        { step: "c", acc: "", chord: "C", octaveOffset: 1 },
        { step: "d", acc: "b", chord: "Db", octaveOffset: 1 },
        { step: "e", acc: "b", chord: "Eb", octaveOffset: 1 },
        { step: "f", acc: "", chord: "F", octaveOffset: 1 },
        { step: "g", acc: "", chord: "G", octaveOffset: 1 },
    ],
    "A": [
        null,
        { step: "a", acc: "", chord: "A", octaveOffset: 0 },
        { step: "b", acc: "", chord: "B", octaveOffset: 0 },
        { step: "c", acc: "#", chord: "C#", octaveOffset: 1 },
        { step: "d", acc: "", chord: "D", octaveOffset: 1 },
        { step: "e", acc: "", chord: "E", octaveOffset: 1 },
        { step: "f", acc: "#", chord: "F#", octaveOffset: 1 },
        { step: "g", acc: "#", chord: "G#", octaveOffset: 1 },
    ],
    "Bb": [
        null,
        { step: "b", acc: "b", chord: "Bb", octaveOffset: 0 },
        { step: "c", acc: "", chord: "C", octaveOffset: 1 },
        { step: "d", acc: "", chord: "D", octaveOffset: 1 },
        { step: "e", acc: "b", chord: "Eb", octaveOffset: 1 },
        { step: "f", acc: "", chord: "F", octaveOffset: 1 },
        { step: "g", acc: "", chord: "G", octaveOffset: 1 },
        { step: "a", acc: "", chord: "A", octaveOffset: 1 },
    ],
    "B": [
        null,
        { step: "b", acc: "", chord: "B", octaveOffset: 0 },
        { step: "c", acc: "#", chord: "C#", octaveOffset: 1 },
        { step: "d", acc: "#", chord: "D#", octaveOffset: 1 },
        { step: "e", acc: "", chord: "E", octaveOffset: 1 },
        { step: "f", acc: "#", chord: "F#", octaveOffset: 1 },
        { step: "g", acc: "#", chord: "G#", octaveOffset: 1 },
        { step: "a", acc: "#", chord: "A#", octaveOffset: 1 },
    ],
    "C#": [
        null,
        { step: "c", acc: "#", chord: "C#", octaveOffset: 0 },
        { step: "d", acc: "#", chord: "D#", octaveOffset: 0 },
        { step: "e", acc: "#", chord: "E#", octaveOffset: 0 },
        { step: "f", acc: "#", chord: "F#", octaveOffset: 0 },
        { step: "g", acc: "#", chord: "G#", octaveOffset: 0 },
        { step: "a", acc: "#", chord: "A#", octaveOffset: 0 },
        { step: "b", acc: "#", chord: "B#", octaveOffset: 0 },
    ],
    "Cb": [
        null,
        { step: "c", acc: "b", chord: "Cb", octaveOffset: 0 },
        { step: "d", acc: "b", chord: "Db", octaveOffset: 0 },
        { step: "e", acc: "b", chord: "Eb", octaveOffset: 0 },
        { step: "f", acc: "b", chord: "Fb", octaveOffset: 0 },
        { step: "g", acc: "b", chord: "Gb", octaveOffset: 0 },
        { step: "a", acc: "b", chord: "Ab", octaveOffset: 0 },
        { step: "b", acc: "b", chord: "Bb", octaveOffset: 0 },
    ],
}

function renderStave(frame, color, width, notes, scale) {

    const scaleInfo = MAJOR_SCALES[scale]

    frame.innerHTML = ""

    let staveNotes = []
    let tieOptions = []
    let tripletNotes = []

    for (let note of notes) {

        let mods = []

        let duration = note.duration
        duration = duration.replace("o", "8")
        duration = duration.replace("x", "16")
        duration = duration.replace("z", "32")

        let pitch = ""
        let noteAcc = ""

        if (note.degree == 0) { // rest
            pitch = duration == "w" ? "d/5" : "b/4"
            duration += "r"
        } else {
            let degreeInfo = scaleInfo[note.degree]
            let step = degreeInfo.step
            let octave = note.octave + degreeInfo.octaveOffset
            const shift = SHIFTS[step]

            if (note.acc === "#") {
                if (degreeInfo.acc === "#") {
                    step = shift[0]
                    octave += shift[1]
                } else if (degreeInfo.acc === "") {
                    noteAcc = "#"
                }
            } else if (note.acc === "b") {
                if (degreeInfo.acc === "b") {
                    step = shift[2]
                    octave -= shift[3]
                } else if (degreeInfo.acc === "") {
                    noteAcc = "b"
                }
            } else {
                noteAcc = degreeInfo.acc
            }

            pitch = step + "/" + octave.toString()
        }

        if (noteAcc !== "") {
            const acc = new Vex.Flow.Accidental(noteAcc)
            mods.push(acc)
        }

        for (let i = 0; i < note.dots; i += 1) {
            let dot = new Vex.Flow.Dot()
            mods.push(dot)
        }

        const staveNote = new Vex.Flow.StaveNote({
            clef: "treble",
            keys: [pitch],
            duration: duration,
            dots: note.dots,
            auto_stem: true,
        })

        mods.forEach(m => staveNote.addModifier(m))

        if (note.transFrom) {
            tieOptions.push({
                first_note: staveNotes[staveNotes.length - 1],
                last_note: staveNote,
                first_indices: [0],
                last_indices: [0],
            })
        }

        staveNotes.push(staveNote)

        if (note.inTriplet) {
            if (tripletNotes.length == 0 || tripletNotes[0].length == 3) {
                tripletNotes.unshift([staveNote])
            } else {
                tripletNotes[0].push(staveNote)
            }
        }

        if (note.chordDegree > 0) {
            let root = scaleInfo[note.chordDegree].chord
            if (note.chordAcc) {
                if (root.endsWith("#")) {
                    if (note.chordAcc === "b") root = root.slice(0, -1)
                    else if (note.chordAcc === "#") root = root + "#"
                } else if (root.endsWith("b")) {
                    if (note.chordAcc === "#") root = root.slice(0, -1)
                    else if (note.chordAcc === "b") root = root + "b"
                } else {
                    root += note.chordAcc
                }
            }
            let chord = root + note.chordSuffix
            let symbol = new Vex.Flow.ChordSymbol()
            symbol.setHorizontal('center')
            symbol.setFontSize(14)
            symbol.addText(chord)
            staveNote.addModifier(symbol)
        }
    }

    if (notes[notes.length - 1].transTo) {
        tieOptions.push({
            first_note: staveNotes[staveNotes.length - 1],
            first_indices: [0],
        })
    }

    const scaledWidth = width * 1.25
    let renderer = new Vex.Flow.Renderer(frame, Vex.Flow.Renderer.Backends.SVG)
    renderer.resize(scaledWidth, 100)
    let context = renderer.getContext()
    context.scale(0.8, 0.8)

    context.setFillStyle(color)
    context.setStrokeStyle(color)

    let stave = new Vex.Flow.Stave(0, 0, scaledWidth)
    stave.setDefaultLedgerLineStyle({ strokeStyle: "#999", lineWidth: 1.4 })
    stave.setContext(context).draw()

    const tuplets = tripletNotes.map(notes => {
        const tuplet = new Vex.Flow.Tuplet(notes, { num_notes: 3, location: Vex.Flow.Tuplet.LOCATION_BOTTOM })
        tuplet.setContext(context)
        return tuplet
    })

    const ties = tieOptions.map(options => {
        const tie = new Vex.Flow.StaveTie(options)
        tie.setContext(context)
        return tie
    })

    Vex.Flow.Formatter.FormatAndDraw(context, stave, staveNotes, true)

    ties.forEach(t => t.draw())
    tuplets.forEach(t => t.draw())
}
