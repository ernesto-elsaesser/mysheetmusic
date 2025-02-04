<?php
$DIR = 'songs';

if (!is_writable($DIR)) {
    http_response_code(401);
    die();
}

if (isset($_POST['name'])) {
    $file = $DIR . '/' . $_POST['name'] . '.txt';
    file_put_contents($file, $_POST['data']);
    http_response_code(201);
}

$files = scandir($DIR);
$songs = array();
foreach( $files as $file ) {
    $parts = explode('.', $file);
    if ($parts[1] != 'txt') continue;
    $name = $parts[0];
    $songs[$name] = file_get_contents($DIR . '/' . $file);
}

echo json_encode($songs);
?>