<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Songs</title>
    <link rel="stylesheet" href="style.css#1" />
</head>

<body>
    <div id="content">
        <div id="songlist">
<?php
    $files = scandir("songs");
    $songs = array();
    foreach($files as $file) {
        $dotpos = strrpos($file, '.');
        $ext = substr($file, $dotpos + 1);
        $name = substr($file, 0, $dotpos);
        if ($ext != 'txt') continue;
        $name = substr($file, 0, -4);
        print("<a target=\"_blank\" href=\"song.php?name=$name\">$name</a>");
        if (file_exists("snaps/$name.html"))
            print(" (<a target=\"_blank\" href=\"snap.php?name=$name\">snap</a>)");
        print("<br/>");
    }
?>
        </div>
    </div>
</body>
</html>