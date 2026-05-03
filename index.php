<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Songs</title>
  <link rel="icon" sizes="any" type="image/svg+xml" href="favicon.svg">
  <style>
  body {
    margin: 24px;
    font-size: 16px;
    line-height: 1.5em;
    background-color: light-dark(#fff, #222);
    color-scheme: light dark;
  }
  a {
    text-decoration: none;
    color: light-dark(#222, #eee);
  }
  form {
    margin-top: 8px;
  }
  </style>
</head>

<body>
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
  <form action="song.php" target="_blank">
    <input type="text" name="name" />
    <input type="submit" value="Create" />
  </form>
</body>
</html>
