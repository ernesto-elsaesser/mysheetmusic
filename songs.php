<?php
$DIR = 'songs';

if (!is_writable($DIR)) {
    http_response_code(401);
    die();
}

if (isset($_POST['name'])) {
    $file = $DIR . '/' . $_POST['name'] . '.txt';
    if (isset($_POST['data'])) {
        file_put_contents($file, $_POST['data']);
        $success = chmod($file, 0666);
    } else {
        $success = unlink($file);
    }
    http_response_code($success ? 200 : 500);
    if (!$success) {
        $error = error_get_last();
        echo $error['message'];
    }
    exit;
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