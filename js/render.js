const C_SCALE_DEGREES = [null, "C", "D", "E", "F", "G", "A", "B"]

function renderStave(frame, color, width, notes) {

    frame.innerHTML = ""

    let staveNotes = []
    let tieOptions = []
    let tripletNotes = []

    for (let note of notes) {

        let mods = []

        for (let acc of note.accs) {
            if (acc == "#") {
                const sharp = new Vex.Flow.Accidental("#")
                mods.push(sharp)
            } else if (dacc == "b") {
                let flat = new Vex.Flow.Accidental("b")
                mods.push(flat)
            }
        }

        for (i = 0; i < note.dots; i += 1) {
            let dot = new Vex.Flow.Dot()
            mods.push(dot)
        }

        let duration = note.duration
        duration = duration.replace("o", "8")
        duration = duration.replace("x", "16")
        duration = duration.replace("z", "32")

        let pitch = ""
        if (note.degree == 0) { // rest
            pitch = duration == "w" ? "d/5" : "b/4"
            duration += "r"
        } else {
            pitch = C_SCALE_DEGREES[note.degree].toLowerCase() + "/" + note.octave.toString()
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
            let chord = C_SCALE_DEGREES[note.chordDegree]
            chord += note.chordSuffix
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
