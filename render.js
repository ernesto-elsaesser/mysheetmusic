function renderSong(textarea, sheet) {

    let factory = new Vex.Flow.Factory({
        renderer: { elementId: sheet.id, width: 0, height: 0 },
    })

    let easy = factory.EasyScore()

    sheet.innerHTML = ""

    textarea.value.split("\n\n").forEach(bar => {
        if (bar == "") return
        let lines = bar.split("\n")
        let harmony = lines.shift()
        let melody = lines.shift()
        if (melody == "") return
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

  if (chords[notes.length] == "~") {
    let tie = new Vex.Flow.StaveTie({
        first_note: notes[notes.length-1],
        first_indices: [0],
    })
    extras.push(tie)
  }

  stave.setContext(context).draw()
  Vex.Flow.Formatter.FormatAndDraw(context, stave, notes, true)
  extras.forEach(e => e.setContext(context).draw())

  for (var i = 0; i < lines.length; i += 1) {
      let lyrics = document.createElement("div")
      lyrics.style.paddingLeft = "10px"
      lyrics.style.whiteSpace = "nowrap"
      lyrics.innerHTML = lines[i]
      element.appendChild(lyrics)
  }

  return element
}

function modifyData(textarea, transform) {

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
    if (row == 0) return
    let harmony = lines[row-1]
    let melody = lines[row]
    let pre = melody.substr(0, col).lastIndexOf(",")
    let left = pre == -1 ? 0 : pre + 2
    let post = melody.substr(col).indexOf(",")
    let right = post == -1 ? melody.length : col + post
    let res = transform(harmony, melody, left, right)
    cursorPos += res[0].length - harmony.length
    cursorPos += res[1].length - melody.length
    lines[row-1] = res[0]
    lines[row] = res[1]
    textarea.focus()
    textarea.value = lines.join("\n")
    textarea.selectionStart = cursorPos
    textarea.selectionEnd = cursorPos
}

function addNote(textarea, note) {

    let chord = "." + " ".repeat(note.length - 1)

    modifyData(textarea, (harmony, melody, left, right) => {
        if (right == 0) {
            harmony = chord
            melody = note
        } else if (right == melody.length) {
            harmony += "  " + chord
            melody += ", " + note
        } else {
            harmony = harmony.substr(0, left) + chord + "  " + harmony.substr(left)
            melody = melody.substr(0, left) + note + ", " + melody.substr(left)
        }
        return [harmony, melody]
    })
}

function dotNote(textarea,) {

    modifyData(textarea, (harmony, melody, left, right) => {
        harmony = harmony.substr(0, right) + " " + harmony.substr(right)
        melody = melody.substr(0, right) + "." + melody.substr(right)
        return [harmony, melody]
    })
}

function tieNote(textarea) {

    modifyData(textarea, (harmony, melody, left, right) => {
        var chord = harmony.substr(left, right)
        if (chord.startsWith(".")) chord = chord.replace(".", "~")
        else chord = "~" + chord.substr(0, -1)
        harmony = harmony.substr(0, left) + chord + harmony.substr(right)
        return [harmony, melody]
    })
}

function deleteNote(textarea) {

    modifyData(textarea, (harmony, melody, left, right) => {
        if (left == 0) right += 2
        else left -= 2
        harmony = harmony.substr(0, left) + harmony.substr(right)
        melody = melody.substr(0, left) + melody.substr(right)
        return [harmony, melody]
    })
}
