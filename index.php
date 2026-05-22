<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Songs</title>
  <link rel="icon" sizes="any" type="image/svg+xml" href="favicon.svg">
  <style>
  body {
    margin: 8px;
    font-size: 16px;
    line-height: 1.5em;
    background-color: light-dark(#fff, #222);
    color: light-dark(#222, #eee);
    color-scheme: light dark;
  }
  a {
    text-decoration: none;
    color: light-dark(#222, #eee);
  }
  form {
    margin-top: 8px;
  }
  .col {
    width: 200px;
    margin: 8px;
    float: left;
  }
  input[type='text'] {
    width: 140px;
  }
  </style>
</head>

<body>
<?php
  $groups = scandir("songs");
  foreach($groups as $group) {
    if ($group[0] == '.') continue;
    echo "<div class=\"col\"><h2>$group</h2>";
    $files = scandir("songs/$group");
    foreach($files as $file) {
      $dotpos = strrpos($file, '.');
      $ext = substr($file, $dotpos + 1);
      $name = substr($file, 0, $dotpos);
      if ($ext != 'txt') continue;
      $name = substr($file, 0, -4);
      echo "<a target=\"_blank\" href=\"song.php?group=$group&name=$name\">$name</a><br/>";
    }
    echo '<form action="song.php" target="_blank"><input type="text" name="name" />';
    echo "<input type=\"text\" name=\"group\" value=\"$group\" hidden />";
    echo ' <input type="submit" value="+" /></form></div>';
  }
?>
</body>
</html>
