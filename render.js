const SCALES = {
    Am: {
        "3,": "c/3", "4,": "d/3", "5,": "e/3", "6,": "f/3", "7,": "g/3",
        "1": "a/3", "2": "b/3", "3": "c/4", "4": "d/4", "5": "e/4", "6": "f/4", "7": "g/4",
        "1'": "a/4", "2'": "b/4", "3'": "c/5", "4'": "d/5", "5'": "e/5", "6'": "f/5", "7'": "g/5",
        "1\"": "a/5", "2\"": "b/5", "3\"": "c/6",
    },
    C: {
        "1,": "c/3", "2,": "d/3", "3,": "e/3", "4,": "f/3", "5,": "g/3", "6,": "a/3", "7,": "b/3",
        "1": "c/4", "2": "d/4", "3": "e/4", "4": "f/4", "5": "g/4", "6": "a/4", "7": "b/4",
        "1'": "c/5", "2'": "d/5", "3'": "e/5", "4'": "f/5", "5'": "g/5", "6'": "a/5", "7'": "b/5",
        "1\"": "c/6",
    },
}

function renderSong(textarea, sheet) {

    let bars = textarea.value.split("\n\n")
    let key = bars.shift()
    let scale = SCALES[key]

    let dark = window.matchMedia('(prefers-color-scheme: dark)').matches
    let color = dark ? "white" : "black"

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
            createBar(element, color, lines, scale, tieEnd)
        } catch (error) {
            element.innerText = error.toString()
            element.style.color = "red"
        }

        sheet.appendChild(element)
    }
}

function createBar(element, color, lines, scale, tieEnd) {

  let melody = lines.shift().split(" ")

  var notes = []
  var ties = []
  var tuplets = []
  for (var i = 0; i < melody.length; i += 1) {

    let data = melody[i].split("")

    var tie = false
    if (data[0] == "~") {
        tie = true
        data.shift()
    }

    var pitchNum = data.shift()
    if ((data[0] == "'") || (data[0] == '"') || (data[0] == ",")) {
        pitchNum += data.shift()
    }
    var pitch = scale[pitchNum]

    var mods = []

    if (data[0] == "#") {
        let sharp = new Vex.Flow.Accidental("#")
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

    var dots = 0
    if (data[0] == ".") {
        let dot = new Vex.Flow.Dot()
        mods.push(dot)
        dots = 1
        data.shift()
    }

    if (pitchNum == "0") {
        pitch = "b/4"
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
    mods.forEach(m => note.addModifier(m))

    if (tie) {
        ties.push({
            first_note: notes[i - 1],
            last_note: note,
            first_indices: [0],
            last_indices: [0],
        })
    }

    if (data[0] == "t") {
        tuplets.push(notes.slice(i-2))
        data.shift()
    }

    if (data.length == 0) continue

    let chordNum = data.shift()
    let chord = scale[chordNum].slice(0, 1).toUpperCase() + data.join("")

    let symbol = new Vex.Flow.ChordSymbol()
    symbol.setHorizontal('center')
    symbol.setFontSize(14)
    symbol.addText(chord)
    note.addModifier(symbol)
  }

  if (tieEnd) {
    ties.push({
        first_note: notes[i - 1],
        first_indices: [0],
    })
  }

  var note_count = notes.length
  if (note_count < 3) note_count = 3

  for (let line of lines) {
    let adj_count = (2 + line.length) / 4.5
    if (adj_count > note_count) note_count = adj_count
  }

  let width = note_count * 40
  element.style.width = (width * 0.8).toString() + "px"

  let renderer = new Vex.Flow.Renderer(element, Vex.Flow.Renderer.Backends.SVG)
  renderer.resize(width, 100)
  let context = renderer.getContext()
  context.scale(0.8, 0.8)
  context.setFillStyle(color)
  context.setStrokeStyle(color)

  let stave = new Vex.Flow.Stave(0, 0, width)
  stave.setDefaultLedgerLineStyle({ strokeStyle: "#999", lineWidth: 1.4 })
  stave.setContext(context).draw()

  Vex.Flow.Formatter.FormatAndDraw(context, stave, notes, true)

  ties.forEach(options => {
    let tie = new Vex.Flow.StaveTie(options)
    tie.setContext(context).draw()
  })

  tuplets.forEach(notes => {
    let tuplet = new Vex.Flow.Tuplet(notes, {location: Vex.Flow.Tuplet.LOCATION_BOTTOM})
    tuplet.setContext(context).draw()
  })

  for (var i = 0; i < lines.length; i += 1) {
      let lyrics = document.createElement("div")
      lyrics.className = "lyrics"
      lyrics.innerHTML = lines[i]
      element.appendChild(lyrics)
  }
}
