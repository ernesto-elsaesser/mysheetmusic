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
    $dotpos = strrpos($file, '.');
    $ext = substr($file, $dotpos + 1);
    $name = substr($file, 0, $dotpos);
    if ($ext != 'txt') continue;
    $name = substr($file, 0, -4);
    $songs[$name] = file_get_contents($DIR . '/' . $file);
}

echo json_encode($songs);
?>