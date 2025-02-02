<?php
$files = scandir("songs");
$songs = array();
foreach( $files as $file ) {
    $parts = explode('.', $file);
    if ($parts[1] != 'txt') continue;
    $name = $parts[0];
    $songs[$name] = file_get_contents("songs/$file");
}
echo json_encode($songs);
?>