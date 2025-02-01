<?php
if( isset( $_POST['data'] ) ) {
    $path = "songs/" . $_GET['name'] . ".txt";
    rename($path, $path . ".bak");
    file_put_contents($path, $_POST['data']);
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
.addbtn {
    width: 24px;
    height: 18px;
    padding: 1px;
    border: 0;
    border-right: 1px solid grey;
    border-bottom: 1px solid grey;
}
</style>
</head>
<body style="margin: 0; font-size: 15px;">
<?php 
$display = isset($_GET['edit']) ? "block" : "none";
$url = "song.php?name=" . $_GET['name'];
echo '<form method="post" action="' . $url . '" style="display: ' . $display . '">';
?>
<textarea id="data" name="data" style="float: left; width: 640px; height: 265px; overflow: scroll; white-space: pre;">
<?php echo file_get_contents("songs/" . $_GET['name'] . ".txt"); ?>
</textarea>
<div style="float: left; border-top: 1px solid grey;">
<?php
$DURATONS = ["1", "2.", "2", "4.", "4", "8", "16"];
$PITCHES = ["A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5", "A5"];
foreach ($PITCHES as $pitch) {
    foreach ($DURATONS as $duration) {
        $label = $duration == "1" ? $pitch : str_replace(".", "&middot;", $duration);
        echo '<button type="button" class="addbtn" onclick="add(' . "'" . $pitch . '/' . $duration . "'" . ')">' . $label . '</button>';
    }
    echo '<br/>';
}
?>
</div>
<div style="clear: both; height: 5px"></div>
<button type="button" onclick="add('B4/2/r')">&frac12; Rest</button>
<button type="button" onclick="add('B4/4/r')">&frac14; Rest</button>
<button type="button" onclick="add('B4/8/r')">&frac18; Rest</button>
<button type="button" onclick="del()">Delete</button>
<button type="button" onclick="draw()">Draw</button>
<input type="submit" value="Save" />
</form>
<div id="sheet" style="margin-left: 20px"></div>
<div style="clear: both; height: 20px"></div>
<script src="https://cdn.jsdelivr.net/npm/vexflow/build/cjs/vexflow.js"></script>
<script src="render.js?v=1"></script>
<script>
function draw() {
    renderSong('data', 'sheet')
}

function add(note) {
    addNote('data', note)
}

function del() {
    deleteNote('data')
}

draw()
</script>
</body>
</html>