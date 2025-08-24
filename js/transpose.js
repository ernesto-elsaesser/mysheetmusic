const DEGREES = ["1", "2", "3", "4", "5", "6", "7"]

function transposeCode(code, steps) {

    let measures = code.split("\n\n")

    for (let i = 0; i < measures.length; i += 1) {
        let measure = measures[i]
        if (measure == "") continue
        let lines = measure.split("\n")
        let notes = lines[0].split(" ")
        lines[0] = notes.map((n) => transposeNote(n, steps)).join(" ")
        measures[i] = lines.join("\n")
    }

    return measures.join("\n\n")
}


function transposeNote(note, steps) {

    let transposed = ""
    if (note[0] == "~") {
        transposed = "~"
        note = note.slice(1)
    }

    for (let i = 0; i < note.length; i += 1) {
        let c = note[i]
        let index = DEGREES.indexOf(c)
        if (index == -1) {
            transposed += c
            continue
        }
        index += steps
        let suffix = null
        if (index < 0) {
            index += DEGREES.length
            if (i == 0) {
                if (note[1] == "'") {
                    i = 1
                } else {
                    suffix = ","
                }
            }
        } else if (index >= DEGREES.length) {
            index -= DEGREES.length
            if (i == 0) {
                if (note[1] == ",") {
                    i = 1
                } else {
                    suffix = "'"
                }
            }
        }
        transposed += DEGREES[index]
        if (suffix) transposed += suffix
    }

    return transposed
}