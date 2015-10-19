<?php
  $url = "http://pbs.twimg.com/profile_images/" . $_GET["url"];
  if(strpos($url,"abs.twimg.com/")!=false) {
    $url = str_replace("http://pbs.twimg.com/profile_images/", "",$url);
  }
  $ext = substr($url, -3,1);
  if ($ext =="gif") {
    $type = "image/gif";
  } elseif ($ext == "png") {
    $type = "image/png";
  } else {
    $type = "image/jpeg";
  }

  header("Content-Type: " . $type);
  header("Content-Length: " . filesize($url));
  readfile($url);
  flush();
  exit;
?>
