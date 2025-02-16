const DURATIONS = {
    w: "1",
    h: "2",
    d: "2d",
    q: "4",
    p: "4d",
    a: "8",
    b: "8d",
    x: "16"
}

// TODO other signatures with sharps and flats
const KEYS = {
    C: 0, Am: +5
}

function renderSong(textarea, sheet) {

    let bars = textarea.value.split("\n\n")
    let header = bars.shift().split(" ")
    let keyShift = KEYS[header[0]]
    let scale = "xcdefgabcdefga".slice(keyShift)
    let octave = parseInt(header[1])

    sheet.innerHTML = ""

    var maxLines = 0
    for (let i = 0; i < bars.length; i += 1) {
        let bar = bars[i]
        if (bar == "") continue
        let lines = bar.split("\n")
        if (lines[0] == "") continue

        let tieEnd = bars[i+1] && (bars[i+1][0] == "~")

        while (lines.length < maxLines) lines.push("&nbsp;")
        if (lines.length > maxLines) maxLines = lines.length

        let element = document.createElement("div")
        element.className = "bar"

        try {
            createBar(element, lines, scale, octave, tieEnd)
        } catch (error) {
            element.innerText = error.toString()
            element.style.color = "red"
        }

        sheet.appendChild(element)
    }
}

function createBar(element, lines, scale, octave, tieEnd) {

  let melody = lines.shift().split(" ")

  let pitches = scale.split("")
  let chords = scale.toUpperCase().split("")

  var notes = []
  var extras = []
  for (var i = 0; i < melody.length; i += 1) {

    let data = melody[i].split("")

    var tie = false
    if (data[0] == "~") {
        tie = true
        data.shift()
    }

    var oct = octave
    while (data[0] == "-") {
        oct -= 1
        data.shift()
    }
    while (data[0] == "+") {
        oct += 1
        data.shift()
    }

    let pitchCode = data.shift()
    var pitch = pitches[parseInt(pitchCode)]
    let durationCode = data.shift()
    var duration = DURATIONS[durationCode]
    if (pitchCode == "0") {
        pitch = "b"
        duration += "r"
    }

    let key = pitch + "/" + oct.toString()
    let note = new Vex.Flow.StaveNote({ keys: [key], duration: duration })
    notes.push(note)

    if (tie) {
        let tie = new Vex.Flow.StaveTie({
            first_note: notes[i - 1],
            last_note: note,
            first_indices: [0],
            last_indices: [0],
        })
        extras.push(tie)
        data.shift()
    }

    if (data[0] == "t") {
        let triplet = new Vex.Flow.Tuplet(notes.slice(i-2), {location: -1})
        extras.push(triplet)
        data.shift()
    }

    if (data.length == 0) continue

    let chordCode = data.shift()
    var chord = chords[parseInt(chordCode)]
    if (data[0] == "m") chord += "m"

    let symbol = new Vex.Flow.ChordSymbol()
    symbol.setHorizontal('center')
    symbol.setFontSize(14)
    symbol.addText(chord)
    note.addModifier(symbol)
  }

  if (tieEnd) {
    let tie = new Vex.Flow.StaveTie({
        first_note: notes[i],
        first_indices: [0],
    })
    extras.push(tie)
  }

  let width = 60 + notes.length * 32
  let renderer = new Vex.Flow.Renderer(element, Vex.Flow.Renderer.Backends.SVG)
  renderer.resize(width, 100)
  let context = renderer.getContext()
  context.scale(0.75, 0.75)
  let scaledWidth = 45 + notes.length * 24
  element.style.width = scaledWidth.toString() + "px"

  let stave = new Vex.Flow.Stave(0, 0, width)
  stave.setContext(context).draw()

  Vex.Flow.Formatter.FormatAndDraw(context, stave, notes, true)
  
  extras.forEach(e => e.setContext(context).draw())

  for (var i = 0; i < lines.length; i += 1) {
      let lyrics = document.createElement("div")
      lyrics.className = "lyrics"
      lyrics.innerHTML = lines[i]
      element.appendChild(lyrics)
  }
}
