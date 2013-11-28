<!DOCTYPE html>
<html>
<head>
    <title>Template</title>
</head>
<body>

<?php
if ((isset($_GET['tid'])) && (isset($_GET['input']))) {
    switch (intval($_GET['tid'], 10)) {
        case 0: // straight in HTML
            echo base64_decode($_GET['input']);
            break;
        case 1: // img tag src attribute, double quoted
            echo "<img src=\"".base64_decode($_GET['input'])."\" />";
            break;
        case 2: // html comment
            echo "<!-- " .base64_decode($_GET['input']) . " -->";
            break;
        case 3: // img tag src attribute, single-quoted
            echo "<img src='".base64_decode($_GET['input'])."' />";
            break;
        case 3: // a tag title attribute, unquoted
            echo "<a title=".base64_decode($_GET['input'])." />#</a>";
            break;
    }
}
else {
  die("No valid Template ID given or no input :(((");
}
?>

</body>
</html>