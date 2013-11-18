<!DOCTYPE html>
<html>
<head>
    <title>Template</title>
</head>
<body>

<?php
if (isset($_GET['var0'])) {
  echo base64_decode($_GET['var0']);
}
else { echo "{{var0}}"; }
?>

<img src="<?php
          if (isset($_GET['var1'])) {
            echo base64_decode($_GET['var1']);
          }
            else { echo "{{var1}}"; }
          ?>" />

<!-- <?php
     if (isset($_GET['var2'])) {
       echo $_GET['var2'];
     }
     else { echo "base64_decode({{var2}})"; }
     ?> -->

</body>
</html>