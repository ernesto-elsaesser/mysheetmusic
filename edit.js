function editSong(textarea, transform) {

    var lines = textarea.value.split("\n")
    let cursor = locateCursor(lines, textarea.selectionStart)
    let melody = lines[cursor.lineNum]
    let pre = melody.slice(0, cursor.colNum).lastIndexOf(" ")
    let left = pre == -1 ? 0 : pre + 1
    let post = melody.slice(cursor.colNum).indexOf(" ")
    let right = post == -1 ? melody.length : cursor.colNum + post
    let res = transform(melody, left, right)
    lines[cursor.lineNum] = res[0]
    let newPos = cursor.offset + res[1]

    textarea.focus()
    textarea.value = lines.join("\n")
    textarea.selectionStart = newPos
    textarea.selectionEnd = newPos
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

function addNote(textarea, note) {

    let len = note.length

    editSong(textarea, (melody, left, right) => {
        if (right == 0) {
            melody = note
            right = len
        } else if (right == melody.length) {
            melody += " " + note
            right += 1 + len
        } else {
            melody = melody.slice(0, left) + note + " " + melody.slice(left)
            right = left + len
        }
        return [melody, right]
    })
}

function dotNote(textarea) {

    editSong(textarea, (melody, left, right) => {
        var note = melody.slice(left, right)
        note = note.replace("h", "d")
        note = note.replace("q", "p")
        note = note.replace("a", "b")
        melody = melody.slice(0, left) + note + melody.slice(right)
        return [melody, left]
    })
}

function tieNote(textarea) {

    editSong(textarea, (melody, left, right) => {
        melody = melody.slice(0, left) + "~" + melody.slice(left)
        return [melody, left]
    })
}

function deleteNote(textarea) {

    editSong(textarea, (melody, left, right) => {
        if (left == 0) right += 1
        else left -= 1
        melody = melody.slice(0, left) + melody.slice(right)
        return [melody, left]
    })
}
