<?php
$name = $_GET['name'];
$file = 'rendered/' . $name . '.html';
$html = file_get_contents('php://input');
file_put_contents($file, $html);
$success = chmod($file, 0666);
http_response_code($success ? 200 : 500);
if ($success) {
    echo "Saved.";
} else {
    $error = error_get_last();
    echo $error['message'];
}
?>
