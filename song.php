<!DOCTYPE html>
<html lang="en">

<?php
$method = $_SERVER['REQUEST_METHOD'];
$name = $_GET['name'];
$file = "songs/$name.txt";

if ($method == 'POST') {
    file_put_contents($file, $_POST['code']);
    $success = chmod($file, 0666);
    if (!$success) {
        $error = error_get_last();
        echo $error['message'];
        exit;
    }
} else if ($method == 'DELETE') {
    $success = unlink($file);
    if ($success) {
        echo "Deleted.";
    } else {
        $error = error_get_last();
        echo $error['message'];
    }
    exit;
}

$verse = 1;
if (isset($_GET['verse'])) $verse = intval($_GET['verse']);

$song = file_get_contents($file);
$parts = explode("\n\n", $song);
$n = count($parts);
?>

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title><?php echo $name; ?></title>
    <script src="https://cdn.jsdelivr.net/npm/vexflow@4.2.5/build/cjs/vexflow.js"></script>
    <script src="js/render.js#1"></script>
    <link rel="stylesheet" href="style.css#1" />
</head>

<body>
    <div id="content">
        <div id="sheet">
<?php
$verse_count = 1;
for($i = 0; $i < $n; $i += 1) {
    $part = $parts[$i];
    if ($part == "") continue;

    $lines = explode("\n", $part);
    $melody = $lines[0];
    $line_count = count($lines);

    $text = "";
    if ($line_count > 1) {
        $verse_count = max($verse_count, $line_count - 1);
        if ($verse < $line_count) $text = $lines[$verse];
        else $text = $lines[1];
    }

    $maxlen = max(strlen($melody), strlen($text));
    $width = max(($maxlen + 1) * 9, 40);

    $tieEnd = 0;
    if ($i + 1 < $n && $parts[$i + 1][0] == "~") $tieEnd = 1;

    echo "<div class=\"measure\" style=\"width: ${width}px\">";
    echo "<div id=\"p$i\" class=\"frame\"></div>";
    echo "<div class=\"lyrics\">$text</div>";
    echo "<script>vx($i, $width, \"$melody\", $tieEnd);</script>";
    echo "</div>";
}
?>
        </div>
    </div>

    <div id="footer">
<?php
echo "<a href=\"edit.php?name=$name\">EDIT</a>";
for ($v = 1; $v <= $verse_count; $v += 1) {
    if ($v != $verse) {
        echo "&nbsp;&nbsp;|&nbsp;&nbsp;";
        echo "<a href=\"song.php?name=$name&verse=$v\">$v</a>";
    }
}
echo "&nbsp;&nbsp;|&nbsp;&nbsp;";
echo "<a href=\"#\" onclick=\"snapshot()\">SNAP</a>";
?>
    </div>
    <script>
        function snapshot() {
            const sheet = document.getElementById("sheet")
            const html = sheet.innerHTML
            fetch('<?php echo "snap.php?name=$name"; ?>', {
                method: 'POST',
                body: html
            }).then((res) => window.alert(res.statusText))
        }
    </script>
</body>
</html>