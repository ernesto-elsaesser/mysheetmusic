<?php
if( isset( $_POST['data'] ) ) {
    $path = "songs/" . $_GET['name'] . ".txt";
    move($path, $path . ".bak");
    file_put_contents($path, $_POST['data']);
    exit();
}
?>

<!DOCTYPE html>
<html>

<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>
<?php echo str_replace('_', ' ', $_GET['name']); ?>
</title>
<style>
#data {
    width: 100%;
    height: 200px;
    overflow: scroll;
    white-space: pre;
}
#editor {
<?php if (empty($_GET['edit'])) echo 'display: none'; ?>
}
#sheet {
    margin: 0 40px 40px;
    font-family: serif;
    font-size: 15px;
}
.addbtn {
    font-size: 16px;
    width: 40px;
}
</style>
</head>

<body>
<div id="editor">
<form method="post">
<textarea id="data" name="data">
<?php echo file_get_contents("songs/" . $_GET['name'] . ".txt"); ?>
</textarea>
<input type="submit">Save</input>
</form>
<button onclick="view()">View</button>
<button onclick="del()">Delete</button>
<button onclick="add('B4/2/r')">Rest 1/2</button>
<button onclick="add('B4/4/r')">Rest 1/4</button>
<button onclick="add('B4/8/r')">Rest 1/8</button>
<?php
$PITCHES = ["G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5", "A5"];
$DURATONS = ["1", "2.", "2", "4.", "4", "8", "16"]
foreach ($DURATONS as $duration) {
    foreach ($PITCHES as $pitch) {
        $label = $duration == "1" ? $pitch : str_replace(".", "&bull;", $duration);
        echo '<button class="addbtn" onclick="add(' . "'" . $pitch . '/' . $duration . "'" . ')">' . $label . '</button>':
    }
    echo '<br/>';
}
?>
</div>
<div id="sheet"></div>
<script src="https://cdn.jsdelivr.net/npm/vexflow/build/cjs/vexflow.js"></script>
<script src="render.js"></script>
<script>
function view() {
    render('data', 'sheet')
}

function add(note) {
    addNote('data', note)
}

function del() {
    deleteNote('data')
}

view()
</script>
</body>

</html>