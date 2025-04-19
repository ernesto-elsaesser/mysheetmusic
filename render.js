const PITCH_MAP = {
    "1,": "c/3", "2,": "d/3", "3,": "e/3", "4,": "f/3", "5,": "g/3", "6,": "a/3", "7,": "b/3",
    "1": "c/4", "2": "d/4", "3": "e/4", "4": "f/4", "5": "g/4", "6": "a/4", "7": "b/4",
    "1'": "c/5", "2'": "d/5", "3'": "e/5", "4'": "f/5", "5'": "g/5", "6'": "a/5", "7'": "b/5",
    "1''": "c/6", "2''": "d/6", "3''": "e/6", "4''": "f/6",  "5''": "g/6", 
}

const PITCHES = [
    "C",
    "D",
    "E",
    "F",
    "G",
    "A",
    "B",
]

const DOWNSHIFTS = {
    "-1": 3,
    "0": 0,
    "1": 4,
}

const OCTAVES = {
    2: ",,",
    3: ",",
    4: "",
    5: "'",
    6: "''",
}

const DURATIONS = {
    1: "w",
    2: "h",
    3: "h.",
    4: "q",
    6: "q.",
    8: "o",
    12: "o.",
    16: "x",
    32: "z",
}

const CONNECTORS = {
    "single": " ",
    "begin": " ",
    "middle": "",
    "end": "",
}

function parseXML(xml) {

    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, "text/xml")
    const eparts = doc.getElementsByTagName("part")

    var parts = {}
    for (let epart of eparts) {
        parts[epart.id]= parsePart(epart, "1")
    }

    return parts
}

function parsePart(epart, voice) {

    const emeasures = epart.getElementsByTagName("measure")

    var whole = 4
    var downshift = 0
    var measures = []
    for (let emeasure of emeasures) {

        const eattr = emeasure.getElementsByTagName("attributes")[0]
        if (eattr) {
            const ekey = eattr.getElementsByTagName("key")[0]
            if (ekey) {
                if (measures.length > 0) {
                    console.log("ERROR: SECOND KEY", emeasure)
                }
                const fifths = ekey.getElementsByTagName("fifths")[0]
                downshift = DOWNSHIFTS[fifths.innerHTML]
            }
            const edivisions = eattr.getElementsByTagName("divisions")[0]
            if (edivisions) {
                whole = parseInt(edivisions.innerHTML) * 4
            }
        }

        // TODO parse <harmony> for chords

        var notes = []
        var lines = []
        const enotes = emeasure.getElementsByTagName("note")
        for (let enote of enotes) {

            const echord = enote.getElementsByTagName("chord")[0]
            if (echord) continue

            const estaff = enote.getElementsByTagName("staff")[0]
            if (estaff && estaff.innerHTML != "1") continue

            const evoice = enote.getElementsByTagName("voice")[0]
            if (evoice.innerHTML != voice) continue

            const eduration = enote.getElementsByTagName("duration")[0]
            if (eduration == undefined) continue

            const epitch = enote.getElementsByTagName("pitch")[0]
            var code = "0"
            if (epitch == undefined) {
                const erest = enote.getElementsByTagName("rest")[0]
                if (erest == undefined) {
                    console.log("ERROR: NO REST", enote)
                }
            } else {
                const estep = epitch.getElementsByTagName("step")[0]
                const eoctave = epitch.getElementsByTagName("octave")[0]
                const ealter = enote.getElementsByTagName("alter")[0]

                const step = estep.innerHTML
                const octave = parseInt(eoctave.innerHTML)
                const alter = ealter ? parseInt(ealter.innerHTML ?? "0") : 0
                
                var degree = PITCHES.indexOf(step) + 1 - downshift
                var modifier = ""
                if (alter != 0) {
                    modifier = "#"
                    if (alter == -1) degree -= 1
                }
                if (degree < 1) {
                    degree += 7
                    octave -= 1
                }
                code = degree.toString() + modifier + OCTAVES[octave]
            }

            const length = whole / parseInt(eduration.innerHTML)
            var duration = DURATIONS[length]
            if (duration == undefined) {
                duration = "?"
                const edot = enote.getElementsByTagName("dot")[0]
                if (edot) duration += "."
                console.log("ERROR: UNMAPPED DURATION", eduration)
            }
            code += duration

            const etie = enote.getElementsByTagName("tie")[0]
            if (etie) {
                const type = etie.attributes["type"].nodeValue
                if (type == "stop") code = "~" + code
            }

            // TODO: <time-modification> for triplets

            notes.push(code)

            const elyrics = enote.getElementsByTagName("lyric")
            while (elyrics.length > lines.length) lines.push("")
            for (let elyric of elyrics) {
                const index = parseInt(elyric.attributes["number"].nodeValue) - 1
                const syllabic = elyric.getElementsByTagName("syllabic")[0].innerHTML
                var text = elyric.getElementsByTagName("text")[0].innerHTML
                if (lines[index]) lines[index] += CONNECTORS[syllabic] + text
                else lines[index] = text
            }
        }

        const melody = notes.join(" ")
        lines.unshift(melody)
        measures.push(lines)
    }

    return measures.map((m) => m.join("\n")).join("\n\n")
}

function renderPart(code, verse, sheet, color) {

    let measures = code.split("\n\n")

    sheet.innerHTML = ""

    var rowCount = 1
    for (let i = 0; i < measures.length; i += 1) {
        let measure = measures[i]
        if (measure == "") continue
        let lines = measure.split("\n")
        if (lines[0] == "") continue

        let melody = lines[0]
        let text = lines[verse] ?? ""
        if (lines.length > rowCount) rowCount = lines.length

        let nextMeasure = measures[i+1]
        let tieEnd = nextMeasure && (nextMeasure[0] == "~")

        let element = document.createElement("div")
        element.className = "measure"

        try {
            createMeasure(element, color, melody, text, tieEnd)
        } catch (error) {
            element.innerText = error.toString()
            element.style.color = "red"
        }

        sheet.appendChild(element)
    }

    return rowCount
}

function createMeasure(element, color, melody, text, tieEnd) {

  let codes = melody.split(" ")

  var notes = []
  var ties = []
  var tuplets = []
  for (var i = 0; i < codes.length; i += 1) {

    let data = codes[i].split("")

    var tie = false
    if (data[0] == "~") {
        tie = true
        data.shift()
    }

    var degree = data.shift()
    while ((data[0] == "'") || (data[0] == ",")) {
        degree += data.shift()
    }
    var pitch = PITCH_MAP[degree]

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

    if (degree == "0") {
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

    let chordDegree = data.shift()
    let chord = PITCH_MAP[chordDegree].slice(0, 1).toUpperCase() + data.join("")

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

  var noteCount = notes.length
  if (noteCount < 2) noteCount = 2
  let wordCount = (2 + text.length) / 4.5
  if (wordCount > noteCount) noteCount = wordCount

  let width = noteCount * 40
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

  let lyrics = document.createElement("div")
  lyrics.className = "lyrics"
  lyrics.innerHTML = text
  element.appendChild(lyrics)
}

function transpose(textarea, shift) {

    let measures = textarea.value.split("\n\n")

    function mapNote(note) {
        
        let found = [1, 2, 3, 4, 5, 6, 7].filter((i) => note.includes(i.toString()))

        for (let a of found) {
            let b = a + shift
            if (b > 7) {
                b -= 7
                if (note.includes(",")) note = note.replace(a.toString() + ",", b.toString())
                else note = note.substr(0, 2).replace(a.toString(), b.toString() + "'") + note.substr(2)
             } else if (b < 1) {
                b += 7
                if (note.includes("'")) note = note.replace(a.toString() + "'", b.toString())
                else note = note.substr(0, 2).replace(a.toString(), b.toString() + ",") + note.substr(2)
             }
            note = note.replace(a.toString(), b.toString())
        }
    
        return note
    }

    for (let i = 0; i < measures.length; i += 1) {
        let measure = measures[i]
        if (measure == "") continue
        let lines = measure.split("\n")
        lines[0] = lines[0].split(" ").map(mapNote).join(" ")
        measures[i] = lines.join("\n")
    }

    textarea.value = measures.join("\n\n")
}
