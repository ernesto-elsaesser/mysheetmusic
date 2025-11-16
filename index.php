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
        echo "<a target=\"_blank\" href=\"song.php?name=$name\">$name</a><br/>";
    }
?>
        </div>
        <form action="edit.php" target="_blank">
            <input type="text" name="name" />
            <input type="submit" value="Create" />
        </form>
    </div>
</body>
</html>