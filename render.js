function renderSong(textId, sheetId) {

    let textarea = document.getElementById(textId)
    let sheet = document.getElementById(sheetId)

    let factory = new Vex.Flow.Factory({
        renderer: { elementId: sheetId, width: 0, height: 0 },
    })

    let easy = factory.EasyScore()

    sheet.innerHTML = ""

    textarea.value.split("\n\n").forEach((bar) => {
        let lines = bar.split("\n")
        let harmony = lines.shift()
        let melody = lines.shift()
        let chords = harmony.trim().split(/ +/)
        let notes = easy.notes(melody)
        let element = createBar(chords, notes, lines)
        sheet.appendChild(element)
    })
}

function createBar(chords, notes, lines) {

  let element = document.createElement("div")
  element.style.marginTop = "20px"
  element.style.float = "left"

  if (notes.length != chords.length) {
      element.innerHTML = "- INVALID DATA -"
      return
  }

  let width = notes.length * 36
  let renderer = new Vex.Flow.Renderer(element, Vex.Flow.Renderer.Backends.SVG)
  renderer.resize(width, 100)
  let context = renderer.getContext()
  context.scale(0.75, 0.75)
  let scaledWidth = notes.length * 27
  element.style.width = scaledWidth.toString() + "px"

  let stave = new Vex.Flow.Stave(0, 0, width)

  var extras = []
  for (var i = 0; i < chords.length; i += 1) {
      let chord = chords[i]
      if (chord == ".") continue

      if (chord[0] == "~") {
          let tie = new Vex.Flow.StaveTie({
              first_note: notes[i-1],
              last_note: notes[i],
              first_indices: [0],
              last_indices: [0],
          })
          extras.push(tie)
          if (chord.length == 1) continue
          chord = chord.substr(1)
      }

      if (chord[0] == "3") {
          let triplet = new Vex.Flow.Tuplet(notes.slice(i, i+3), {location: -1})
          extras.push(triplet)
          if (chord.length == 1) continue
          chord = chord.substr(1)
      }

      let symbol = new Vex.Flow.ChordSymbol()
      symbol.setHorizontal('center')
      symbol.setFontSize(14)
      symbol.addText(chord)
      notes[i].addModifier(symbol)
  }

  stave.setContext(context).draw()
  Vex.Flow.Formatter.FormatAndDraw(context, stave, notes, true)
  extras.forEach((e) => e.setContext(context).draw())

  for (var i = 0; i < lines.length; i += 1) {
      let lyrics = document.createElement("div")
      lyrics.style.paddingLeft = "10px"
      lyrics.innerHTML = lines[i]
      element.appendChild(lyrics)
  }

  return element
}

function modifyData(textId, transform) {

    let textarea = document.getElementById(textId)
    var cursorPos = textarea.selectionStart
    var lines = textarea.value.split("\n")
    var startPos = 0
    var row = 0
    var col = 0
    for (var i = 0; i < lines.length; i += 1) {
        let endPos = startPos + lines[i].length + 1
        if ((startPos <= cursorPos) && (endPos > cursorPos)) {
            row = i
            col = cursorPos - startPos
            break
        }
        startPos = endPos
    }
    let harmony = lines[row-1]
    let melody = lines[row]
    let res = transform(harmony, melody, col)
    cursorPos += res[0].length - harmony.length
    cursorPos += res[1].length - melody.length
    lines[row-1] = res[0]
    lines[row] = res[1]
    song.focus()
    song.value = lines.join("\n")
    song.selectionStart = cursorPos
    song.selectionEnd = cursorPos
}

function addNote(textId, note) {

    let chord = "." + " ".repeat(note.length - 1)

    modify(textId, (harmony, melody, col) => {
        if (melody.length == 0) {
            harmony = chord
            melody = note
        } else if (col == melody.length) {
            harmony += "  " + chord
            melody += ", " + note
        } else {
            harmony = harmony.substr(0, col) + chord + "  " + harmony.substr(col)
            melody = melody.substr(0, col) + note + ", " + melody.substr(col)
        }
        return [harmony, melody]
    })
}

function deleteNote(textId) {

    modify(textId, (harmony, melody, col) => {
        let tail = melody.substr(col)
        let len = tail.indexOf(",")
        if (len == -1) {
            harmony = harmony.substr(0, col > 0 ? col - 2 : 0)
            melody = melody.substr(0, col > 0 ? col - 2 : 0)
        } else {
            harmony = harmony.substr(0, col) + harmony.substr(col + len + 2)
            melody = melody.substr(0, col) + melody.substr(col + len + 2)
        }
        return [harmony, melody]
    })
}
