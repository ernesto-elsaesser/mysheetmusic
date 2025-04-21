const PITCHES = {
    "1,": "c/3", "2,": "d/3", "3,": "e/3", "4,": "f/3", "5,": "g/3", "6,": "a/3", "7,": "b/3",
    "1": "c/4", "2": "d/4", "3": "e/4", "4": "f/4", "5": "g/4", "6": "a/4", "7": "b/4",
    "1'": "c/5", "2'": "d/5", "3'": "e/5", "4'": "f/5", "5'": "g/5", "6'": "a/5", "7'": "b/5",
    "1''": "c/6", "2''": "d/6", "3''": "e/6", "4''": "f/6",  "5''": "g/6", 
}

function renderMeasure(frame, isDark, width, melody, tieEnd) {

    frame.innerHTML = ""

    let notes = []
    let ties = []
    let triplets = []
    let inTriplet = false

    for (let code of melody.split(" ")) {

      if (code == "|") {
          inTriplet = false
          continue
      }
  
      const data = code.split("")
  
      let tie = false
      if (data[0] == "~") {
          tie = true
          data.shift()
      }
  
      let degree = data.shift()
      while ((data[0] == "'") || (data[0] == ",")) {
          degree += data.shift()
      }
      let pitch = PITCHES[degree]
  
      let mods = []
  
      if (data[0] == "#") {
          const sharp = new Vex.Flow.Accidental("#")
          mods.push(sharp)
          data.shift()
      }
  
      if (data[0] == "b") {
          let flat = new Vex.Flow.Accidental("b")
          mods.push(flat)
          data.shift()
      }
  
      var duration = data.shift()
      duration = duration.replace("o", "8")
      duration = duration.replace("x", "16")
      duration = duration.replace("z", "32")
  
      let dots = 0
      if (data[0] == ".") {
          let dot = new Vex.Flow.Dot()
          mods.push(dot)
          dots = 1
          data.shift()
      }
  
      if (degree == "0") {
          pitch = duration == "w" ? "d/5" : "b/4"
          duration += "r"
      }
  
      let note = new Vex.Flow.StaveNote({
          clef: "treble",
          keys: [pitch],
          duration: duration,
          dots: dots,
          auto_stem: true,
      })
      notes.push(note)
  
      if (data[0] == "t") {
          data.shift()
          if (inTriplet) {
              triplets[0].push(note)
          } else {
              triplets.unshift([note])
              inTriplet = true
          }
      } else {
          inTriplet = false
      }
  
      mods.forEach(m => note.addModifier(m))
  
      if (tie) {
          ties.push({
              first_note: notes[notes.length - 2],
              last_note: note,
              first_indices: [0],
              last_indices: [0],
          })
      }
  
      if (data.length == 0) continue
  
      const chordDegree = data.shift()
      let chord = PITCHES[chordDegree].slice(0, 1).toUpperCase()
      chord += data.join("")
  
      let symbol = new Vex.Flow.ChordSymbol()
      symbol.setHorizontal('center')
      symbol.setFontSize(14)
      symbol.addText(chord)
      note.addModifier(symbol)
    }
  
    if (tieEnd) {
      ties.push({
          first_note: notes[notes.length - 1],
          first_indices: [0],
      })
    }
  
    const scaledWidth = width * 1.25
    let renderer = new Vex.Flow.Renderer(frame, Vex.Flow.Renderer.Backends.SVG)
    renderer.resize(scaledWidth, 100)
    let context = renderer.getContext()
    context.scale(0.8, 0.8)
    
    const color = isDark ? "white" : "black"
    context.setFillStyle(color)
    context.setStrokeStyle(color)
  
    let stave = new Vex.Flow.Stave(0, 0, scaledWidth)
    stave.setDefaultLedgerLineStyle({ strokeStyle: "#999", lineWidth: 1.4 })
    stave.setContext(context).draw()
  
    Vex.Flow.Formatter.FormatAndDraw(context, stave, notes, true)
  
    ties.forEach(options => {
        const tie = new Vex.Flow.StaveTie(options)
        tie.setContext(context).draw()
    })
  
    triplets.forEach(notes => {
        const tuplet = new Vex.Flow.Tuplet(notes, {num_notes: 3, location: Vex.Flow.Tuplet.LOCATION_BOTTOM})
        tuplet.setContext(context).draw()
    })
}
