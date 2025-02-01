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
    $name = substr($file, 0, strlen($file) - 4);
    echo '<a href="song.php?name=' . $name . '">' . $name . '</a><br/>';
}
?>
</body>

</html>