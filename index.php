<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Songs</title>
    <link rel="stylesheet" href="style.css#20251022" />
</head>

<body>

    <div id="songs">
<?php
    $files = scandir("songs");
    $songs = array();
    foreach( $files as $file ) {
        $dotpos = strrpos($file, '.');
        $ext = substr($file, $dotpos + 1);
        $name = substr($file, 0, $dotpos);
        if ($ext != 'txt') continue;
        $name = substr($file, 0, -4);
        $song = file_get_contents($DIR . '/' . $file);
        print("<a href=\"song.php?name=$name&verse=1\">$name</a><br/>");
    }
?>
    </div>
</body>
</html>