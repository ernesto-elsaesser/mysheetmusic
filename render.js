const { createSVGWindow } = require('svgdom');
const window = createSVGWindow();
const document = window.document;

global.window = window;
global.document = document;

const vexflow = require('vexflow');
const Vex = vexflow.Vex || vexflow.default || vexflow;

const MAJOR = [null, 0, 2, 4, 5, 7, 9, 11];
const STEPS = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];


function renderStave(color, width, notes, tieEnd, offset) {

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    let staveNotes = [];
    let tieOptions = [];
    let tripletNotes = [];

    for (let note of notes) {
        let mods = [];

        let duration = note.dur;
        duration = duration.replace("o", "8");
        duration = duration.replace("x", "16");
        duration = duration.replace("z", "32");

        let pitch = "";
        let noteAcc = "";

        if (note.deg == 0) { // rest
            pitch = duration == "w" ? "d/5" : "b/4";
            duration += "r";
        } else {
            let octave = note.oct;
            let tones = offset + MAJOR[note.deg];
            if (note.acc === "#") {
                tones += 1;
            } else if (note.acc === "b") {
                tones -= 1;
                if (tones < 0) {
                    octave -= 1;
                    tones += 12;
                }
            }
            if (tones > 11) {
                octave += 1;
                tones -= 12;
            }
            const name = STEPS[tones];
            pitch = name[0] + "/" + octave.toString();
            noteAcc = name[1] || "";
        }

        if (noteAcc !== "") {
            const acc = new Vex.Flow.Accidental(noteAcc);
            mods.push(acc);
        }

        const dots = note.dot || 0;
        for (let i = 0; i < dots; i += 1) {
            let dot = new Vex.Flow.Dot();
            mods.push(dot);
        }

        const staveNote = new Vex.Flow.StaveNote({
            clef: "treble",
            keys: [pitch],
            duration: duration,
            dots: dots,
            auto_stem: true,
        });

        mods.forEach(m => staveNote.addModifier(m));

        if (note.tie) {
            tieOptions.push({
                first_note: staveNotes[staveNotes.length - 1],
                last_note: staveNote,
                first_indices: [0],
                last_indices: [0],
            });
        }

        staveNotes.push(staveNote);

        if (note.tri) {
            if (tripletNotes.length == 0 || tripletNotes[0].length == 3) {
                tripletNotes.unshift([staveNote]);
            } else {
                tripletNotes[0].push(staveNote);
            }
        }

        if (note.crd) {
            let tones = offset + MAJOR[note.crd.deg];
            if (note.crd.acc === "#") {
                tones += 1;
            } else if (note.crd.acc === "b") {
                tones -= 1;
                if (tones < 0) tones += 12;
            }
            if (tones > 11) tones -= 12;
            const chordName = STEPS[tones].toUpperCase();
            let chord = chordName + note.crd.mod;
            let symbol = new Vex.Flow.ChordSymbol();
            symbol.setHorizontal('center');
            symbol.setFontSize(14);
            symbol.addText(chord);
            staveNote.addModifier(symbol);
        }
    }

    if (tieEnd) {
        tieOptions.push({
            first_note: staveNotes[staveNotes.length - 1],
            first_indices: [0],
        });
    }

    const scaledWidth = width * 1.25;
    let renderer = new Vex.Flow.Renderer(svg, Vex.Flow.Renderer.Backends.SVG);
    renderer.resize(scaledWidth, 100);
    let context = renderer.getContext();
    context.scale(0.8, 0.8);

    context.setFillStyle(color);
    context.setStrokeStyle(color);

    let stave = new Vex.Flow.Stave(0, 0, scaledWidth);
    stave.setDefaultLedgerLineStyle({ strokeStyle: "#999", lineWidth: 1.4 });
    stave.setContext(context).draw();

    const tuplets = tripletNotes.map(notes => {
        const tuplet = new Vex.Flow.Tuplet(notes, { num_notes: 3, location: Vex.Flow.Tuplet.LOCATION_BOTTOM });
        tuplet.setContext(context);
        return tuplet;
    });

    const ties = tieOptions.map(options => {
        const tie = new Vex.Flow.StaveTie(options);
        tie.setContext(context);
        return tie;
    });

    Vex.Flow.Formatter.FormatAndDraw(context, stave, staveNotes, true);

    ties.forEach(t => t.draw());
    tuplets.forEach(t => t.draw());

    return svg.outerHTML;
}

module.exports = {
    renderStave,
};

