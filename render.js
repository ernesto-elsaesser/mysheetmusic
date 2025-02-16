const PITCHES = "xcdefgabcdefga".split("")

const CHORDS = {
    i: -1, ii: -2, iii: -3, iv: -4, v: -5, vi: -6,
    I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
}

// TODO other signatures with sharps and flats
const KEYS = {
    C: 0, Am: +5
}

function renderSong(textarea, sheet) {

    let bars = textarea.value.split("\n\n")
    let header = bars.shift().split(" ")
    let keyShift = KEYS[header[0]]
    let scale = PITCHES.slice(keyShift)
    let octave = parseInt(header[1])

    sheet.innerHTML = ""

    var maxLines = 0
    for (let bar of bars) {
        if (bar == "") continue
        let lines = bar.split("\n")
        if (lines[0] == "") continue
        while (lines.length < maxLines) lines.push("&nbsp;")
        if (lines.length > maxLines) maxLines = lines.length

        let element = document.createElement("div")
        element.className = "bar"

        try {
            createBar(element, lines, scale, octave)
        } catch (error) {
            element.innerText = "INVALID DATA"
            element.style.color = "red"
        }


        sheet.appendChild(element)
    }
}

function createBar(element, lines, scale, octave) {

  let parts = lines.shift().split(": ")
  let chord = parts[0]
  let melody = parts[1].split(" ")

  var notes = []
  var extras = []
  for (var i = 0; i < melody.length; i += 1) {

    let parts = melody[i].split("/")
    var pitchCode = parts[0]
    var duration = parts[1]
    let flags = parts.length > 2 ? parts[2] : ""

    var pitch = "b"
    var oct = octave
    if (pitchCode == "0") {
        duration += "r"
    } else {
        while (pitchCode[0] == "-") {
            oct -= 1
            pitchCode = pitchCode.slice(1)
        }
        while (pitchCode[0] == "+") {
            oct += 1
            pitchCode = pitchCode.slice(1)
        }
        pitch = scale[parseInt(pitchCode)]
    }

    let key = pitch + "/" + oct.toString()
    let note = new Vex.Flow.StaveNote({ keys: [key], duration: duration })
    notes.push(note)

    if (flags.includes("~")) {
        let tie = new Vex.Flow.StaveTie({
            first_note: notes[i - 1],
            last_note: note,
            first_indices: [0],
            last_indices: [0],
        })
        extras.push(tie)
    }

    if (flags.includes("$")) {
        let tie = new Vex.Flow.StaveTie({
            first_note: note,
            first_indices: [0],
        })
        extras.push(tie)
    }

    if (flags.includes("3")) {
        let triplet = new Vex.Flow.Tuplet(notes.slice(i-2), {location: -1})
        extras.push(triplet)
    }

  }

  if (chord != "") {
    let code = CHORDS[chord]
    var text = ""
    if (code < 0) {
        text = scale[-code].toUpperCase() + "m"
    } else {
        text = scale[code].toUpperCase()
    }

    let symbol = new Vex.Flow.ChordSymbol()
    symbol.setHorizontal('center')
    symbol.setFontSize(14)
    symbol.addText(text)
    notes[0].addModifier(symbol)
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
