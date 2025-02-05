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
  Vex.Flow.Formatter.FormatAndDraw(context, stave, notes, true)
  extras.forEach(e => e.setContext(context).draw())

  for (var i = 0; i < lines.length; i += 1) {
      let lyrics = document.createElement("div")
      lyrics.className = "lyrics"
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
    let pre = melody.slice(0, col).lastIndexOf(",")
    let left = pre == -1 ? 0 : pre + 2
    let post = melody.slice(col).indexOf(",")
    let right = post == -1 ? melody.length : col + post
    let res = transform(harmony, melody, left, right)
    lines[row-1] = res[0]
    lines[row] = res[1]
    let delta = res[0].length - harmony.length
    let newPos = startPos + delta + res[2]
    textarea.focus()
    textarea.value = lines.join("\n")
    textarea.selectionStart = newPos
    textarea.selectionEnd = newPos
}

function addNote(textarea, note) {

    let len = note.length
    let chord = "." + " ".repeat(len - 1)

    modifyData(textarea, (harmony, melody, left, right) => {
        if (right == 0) {
            harmony = chord
            melody = note
            right = len
        } else if (right == melody.length) {
            harmony += "  " + chord
            melody += ", " + note
            right += 2 + len
        } else {
            harmony = harmony.slice(0, left) + chord + "  " + harmony.slice(left)
            melody = melody.slice(0, left) + note + ", " + melody.slice(left)
            right = left + len
        }
        return [harmony, melody, right]
    })
}

function dotNote(textarea,) {

    modifyData(textarea, (harmony, melody, left, right) => {
        harmony = harmony.slice(0, right) + " " + harmony.slice(right)
        melody = melody.slice(0, right) + "." + melody.slice(right)
        return [harmony, melody, left]
    })
}

function tieNote(textarea) {

    modifyData(textarea, (harmony, melody, left, right) => {
        var chord = harmony.slice(left, right)
        if (chord.startsWith(".")) chord = chord.replace(".", "~")
        else chord = "~" + chord.slice(0, -1)
        harmony = harmony.slice(0, left) + chord + harmony.slice(right)
        return [harmony, melody, left]
    })
}

function deleteNote(textarea) {

    modifyData(textarea, (harmony, melody, left, right) => {
        if (left == 0) right += 2
        else left -= 2
        harmony = harmony.slice(0, left) + harmony.slice(right)
        melody = melody.slice(0, left) + melody.slice(right)
        return [harmony, melody, left]
    })
}
