const { createSVGWindow } = require('svgdom');
const window = createSVGWindow();
const document = window.document;

global.window = window;
global.document = document;

const vexflow = require('vexflow');
const Vex = vexflow.Vex || vexflow.default || vexflow;

const STEPS = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];


function renderSong(song, scaleOffset) {

  const last = song.length - 1;
  let sheet = "";
  for (let i = 0; i < song.length; i += 1) {
      const measure = song[i];
      const textLengths = measure.lyrics.map((l) => l.length);
      const notesLength = Math.max(measure.notes.length, 3) * 3;
      const maxLength = Math.max(notesLength, ...textLengths);
      const width = Math.max(40, (maxLength + 1) * 9);
      const tieEnd = i < last ? song[i+1].notes[0].tie : false;
      const svg = renderStave("black", width, measure.notes, tieEnd, scaleOffset);
      const lyrics = measure.lyrics.join("<br>");
      sheet += `<div class="measure" style="width: ${width}px;">` +
          `<div class="frame">${svg}</div>` +
          `<div class="lyrics">${lyrics}</div></div>\n`;
  }
  return sheet;
}

function renderStave(color, width, notes, tieEnd, offset) {

    const container = document.createElement("div");

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
        let acc = null;

        if (note.val == null) { // rest
            pitch = duration == "w" ? "d/5" : "b/4";
            duration += "r";
        } else {
            let octave = 4 + note.oct;
            let value = offset + note.val;
            if (value > 11) {
                octave += 1;
                value -= 12;
            }
            const name = STEPS[value];
            pitch = name[0] + "/" + octave.toString();
            acc = name[1];
        }

        if (acc) {
            const accidental = new Vex.Flow.Accidental(acc);
            mods.push(accidental);
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
            let value = offset + note.crd.val;
            if (value > 11) value -= 12;
            const chordName = STEPS[value].toUpperCase();
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
    let renderer = new Vex.Flow.Renderer(container, Vex.Flow.Renderer.Backends.SVG);
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

    return container.firstChild.outerHTML;
}

module.exports = {
    renderStave,
};

