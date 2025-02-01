<!DOCTYPE html>
<html>

<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Songs</title>
</head>

<body>
<?php
$files = scandir("songs");
foreach( $files as $file ) {
    $parts = explode('.', $file);
    if ($parts[0] == '') continue;
    $name = $parts[0];
    $title = str_replace('_', ' ', $name);
    echo '<a href="song.php?name=' . $name . '">' . $title . '</a> (<a href="song.php?name=' . $name . '&edit">edit</a>)<br/>';
}
?>
</body>

</html>