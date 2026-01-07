
function parseCode(code) {

    return code.split("\n\n").map((measure) => {

        let lyrics = measure.split("\n")
        let melody = lyrics.shift()
        let notes = []

        for (let token of melody.split(" ")) {

            if (token == "") break
            if (token == "|") continue

            let note = {
                degree: 0,
                octave: 4,
                duration: "",
                accs: "",
                dots: 0,
                isTied: false,
                isTriplet: false,
                chordDegree: 0,
                chordSuffix: "",
            }

            const data = token.split("")

            if (data[0] == "~") {
                note.isTied = true
                data.shift()
            }

            note.degree = parseInt(data.shift())
            while (data[0] == "'") {
                data.shift()
                note.octave += 1
            }
            while (data[0] == ",") {
                data.shift()
                note.octave -= 1
            }

            if (data[0] == "#") {
                note.accs += "#"
                data.shift()
            }

            if (data[0] == "b") {
                note.accs += "b"
                data.shift()
            }

            note.duration = data.shift()

            while (data[0] == ".") {
                note.dots += 1
                data.shift()
            }

            if (data[0] == "t") {
                data.shift()
                note.isTriplet = true
            }

            notes.push(note)

            if (data.length == 0) continue

            note.chordDegree = parseInt(data.shift())
            note.chordSuffix = data.join("")
        }

        return {notes: notes, source: melody, lyrics: lyrics}

    }).filter((l) => l.notes.length > 0)
}
