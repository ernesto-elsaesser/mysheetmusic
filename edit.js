function editSong(textarea, transform) {

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

    editSong(textarea, (harmony, melody, left, right) => {
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

function dotNote(textarea) {

    editSong(textarea, (harmony, melody, left, right) => {
        harmony = harmony.slice(0, right) + " " + harmony.slice(right)
        melody = melody.slice(0, right) + "." + melody.slice(right)
        return [harmony, melody, left]
    })
}

function tieNote(textarea) {

    editSong(textarea, (harmony, melody, left, right) => {
        var chord = harmony.slice(left, right)
        if (chord.startsWith(".")) chord = chord.replace(".", "~")
        else chord = "~" + chord.slice(0, -1)
        harmony = harmony.slice(0, left) + chord + harmony.slice(right)
        return [harmony, melody, left]
    })
}

function deleteNote(textarea) {

    editSong(textarea, (harmony, melody, left, right) => {
        if (left == 0) right += 2
        else left -= 2
        harmony = harmony.slice(0, left) + harmony.slice(right)
        melody = melody.slice(0, left) + melody.slice(right)
        return [harmony, melody, left]
    })
}

function transposeSong(textarea, steps) {

    let pitches = ["C", "D", "E", "F", "G", "A", "B"]

    let bars = textarea.value.split("\n\n").map(s => s.split("\n"))

    for (let lines of bars) {
        lines[1] = lines[1].split(", ").map(n => {
            if (n.endsWith("r")) return n
            var o = parseInt(n[1])
            var i = pitches.indexOf(n[0]) + steps
            if (i < 0) {
                o -= 1
                i += 7
            } else if (i > 6) {
                o += 1
                i -= 7
            }
            return pitches[i] + o.toString() + n.slice(2)
        }).join(", ")
    }

    textarea.value = bars.map(b => b.join("\n")).join("\n\n")
}
