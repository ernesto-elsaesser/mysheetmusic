<!DOCTYPE html>
<html lang="en">

<?php
$method = $_SERVER['REQUEST_METHOD'];
$name = $_GET['name'];
$mode = $_GET['mode'];
$file = "snaps/$name.html";

if ($method == 'POST') {
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
    exit;
}
?>

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title><?php echo $name; ?></title>
    <link rel="stylesheet" href="style.css#1" />
</head>

<body>
    <div id="content">
        <div id="sheet">
<?php
$html = file_get_contents($file);
if ($mode == "dark") $html = str_replace("", "", $html);
else if ($mode == "light") $html = str_replace("", "", $html);
echo $html;
?>
        </div>
    </div>
</body>
</html>