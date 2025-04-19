<?php
$DIR = 'songs';

if (!is_writable($DIR)) {
    http_response_code(401);
    die();
}

if (isset($_POST['name'])) {
    $file = $DIR . '/' . $_POST['name'] . '.xml';
    $count = file_put_contents($file, $_POST['data']);
    chmod($file, 0666);
    http_response_code($count ? 201 : 401);
}

$files = scandir($DIR);
$songs = ["txt" => [], "xml" => []];
foreach( $files as $file ) {
    $parts = explode('.', $file);
    $name = $parts[0];
    $ext = $parts[1];
    $songs[$ext][$name] = file_get_contents($DIR . '/' . $file);
}

echo json_encode($songs);
?>