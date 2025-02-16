function editSong(textarea, transform) {

    var lines = textarea.value.split("\n")
    let cursor = locateCursor(lines, textarea.selectionStart)
    if (cursor.lineNum == 0) return

    let harmony = lines[cursor.lineNum-1]
    let melody = lines[cursor.lineNum]
    let pre = melody.slice(0, cursor.colNum).lastIndexOf(",")
    let left = pre == -1 ? 0 : pre + 2
    let post = melody.slice(cursor.colNum).indexOf(",")
    let right = post == -1 ? melody.length : cursor.colNum + post
    let res = transform(harmony, melody, left, right)
    lines[cursor.lineNum-1] = res[0]
    lines[cursor.lineNum] = res[1]
    let delta = res[0].length - harmony.length
    let newPos = cursor.offset + delta + res[2]
    
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

        lines[0] = lines[0].split("").map(c => {
            let i = pitches.indexOf(c)
            return i == -1 ? c : pitches[(i + steps + 7) % 7]
        }).join("")

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

function splitBar(textarea) {

    var lines = textarea.value.split("\n")
    let cursor = locateCursor(lines, textarea.selectionStart)

    var newLines = [""]
    var i = cursor.lineNum
    while (lines[i] != "") {
        let head = lines[i].slice(0, cursor.colNum)
        let tail = lines[i].slice(cursor.colNum)
        lines[i] = head
        newLines.push(tail)
        i += 1
    }

    lines = lines.slice(0, i) + newLines + lines.slice(i)
    textarea.focus()
    textarea.value = lines.join("\n")
}

function locateCursor(lines, selectionStart) {

    var offset = 0
    for (var lineNum = 0; lineNum < lines.length; lineNum += 1) {
        let nextLineStart = offset + lines[lineNum].length + 1
        if ((offset <= selectionStart) && (nextLineStart > selectionStart)) {
            let colNum = selectionStart - offset
            return {lineNum, colNum, offset}
        }
        offset = nextLineStart
    }
}
