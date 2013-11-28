<!DOCTYPE html>
<html>
<head>
    <title>Template</title>
</head>
<body>

<?php
if ((isset($_GET['tid'])) && (isset($_GET['input']))) {
    switch (intval($_GET['tid'], 10)) {
        case 0:
            echo base64_decode($_GET['input']);
            break;
        case 1:
            echo "<img src=\"".base64_decode($_GET['input'])."\" />";
            break;
        case 2:
            echo "<!-- " .base64_decode($_GET['input']) . " -->";
            break;
        case 3:
            echo "<img src='".base64_decode($_GET['input'])."' />";
            break;
    }
}
else {
  die("No valid Template ID given or no input :(((");
}
?>

</body>
</html>