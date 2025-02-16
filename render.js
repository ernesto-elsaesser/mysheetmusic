function renderSong(textarea, sheet) {

    let bars = textarea.value.split("\n\n")

    let factory = new Vex.Flow.Factory({
        renderer: { elementId: sheet.id, width: 0, height: 0 },
    })

    let easy = factory.EasyScore()

    sheet.innerHTML = ""

    var maxLines = 0
    for (let bar of bars) {
        if (bar == "") continue
        let lines = bar.split("\n")
        let harmony = lines.shift()
        let melody = lines.shift()
        if (melody == "") continue
        let chords = harmony.trim().split(/ +/)
        let notes = easy.notes(melody)
        if (lines.length < maxLines) lines.push("&nbsp;")
        else maxLines = lines.length
        let element = createBar(chords, notes, lines)
        sheet.appendChild(element)
    }
}

function createBar(chords, notes, lines) {

  let element = document.createElement("div")
  element.className = "bar"

  let width = 60 + notes.length * 32
  let renderer = new Vex.Flow.Renderer(element, Vex.Flow.Renderer.Backends.SVG)
  renderer.resize(width, 100)
  let context = renderer.getContext()
  context.scale(0.75, 0.75)
  let scaledWidth = 45 + notes.length * 24
  element.style.width = scaledWidth.toString() + "px"

  let stave = new Vex.Flow.Stave(0, 0, width)

  var extras = []
  for (var i = 0; i < notes.length; i += 1) {
      let chord = chords[i]
      if ((chord == undefined) || (chord == ".")) continue

      if (chord[0] == "~") {
          let tie = new Vex.Flow.StaveTie({
              first_note: notes[i-1],
              last_note: notes[i],
              first_indices: [0],
              last_indices: [0],
          })
          extras.push(tie)
          if (chord.length == 1) continue
          chord = chord.slice(1)
      }

      if (chord[0] == "3") {
          let triplet = new Vex.Flow.Tuplet(notes.slice(i, i+3), {location: -1})
          extras.push(triplet)
          if (chord.length == 1) continue
          chord = chord.slice(1)
      }

      let symbol = new Vex.Flow.ChordSymbol()
      symbol.setHorizontal('center')
      symbol.setFontSize(14)
      symbol.addText(chord)
      notes[i].addModifier(symbol)
  }

  if (chords[notes.length] == "~") {
    let tie = new Vex.Flow.StaveTie({
        first_note: notes[notes.length-1],
        first_indices: [0],
    })
    extras.push(tie)
  }

  stave.setContext(context).draw()

  try {
    Vex.Flow.Formatter.FormatAndDraw(context, stave, notes, true)
  } catch (error) {
    let msg = document.createElement("div")
    msg.innerText = "INVALID DATA"
    msg.style.color = "red"
    element.appendChild(msg)
  }
  
  extras.forEach(e => e.setContext(context).draw())

  for (var i = 0; i < lines.length; i += 1) {
      let lyrics = document.createElement("div")
      lyrics.className = "lyrics"
      lyrics.innerHTML = lines[i]
      element.appendChild(lyrics)
  }

  return element
}
