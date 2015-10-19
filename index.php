<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<html><head><link href='https://fonts.googleapis.com/css?family=Source+Sans+Pro' rel='stylesheet' type='text/css'>
<link rel="stylesheet" type="text/css" href="v2.css">
<title>Star Hose</title></head>
<body>

<?php
require("functions.php");
require("config.php");

$connect = mysqli_connect($sql_host, $sql_user, $sql_pass, $sql_dbname);
$connect->set_charset("utf8");
$result = mysqli_query($connect, "select * from tweets order by tweet_id DESC LIMIT 100;");
$tweets = array();

while ($row = mysqli_fetch_array($result,MYSQLI_ASSOC)) { $tweets[] = $row;}

if( ($_GET["debug"] == "") && (isset($_GET["debug"])) ) {
  print("<pre>");
  print_r($tweets);
  print("</pre></body></html>");
  exit;
}

?><div class="tweet-container">
<?php

foreach($tweets as $tweet) {
$tweet['profile_image_url'] = "img.php?url=" . str_replace("http://pbs.twimg.com/profile_images/", "", $tweet['profile_image_url']);
?>

<span class="tweet">
  <span class="left-column">
    <img class="profile-image" src="<?=$tweet['profile_image_url']?>" />
  </span>
  <span class="right-column">
    <span class="user">
      <span class="user-name"><?=$tweet['name']?></span>
      <span class="user-handle"><?=$tweet['screen_name']?></span>
    </span>
    <span class="tweet-text" id="<?=$tweet['tweet_id']?>"><?=linkify($tweet['tweet_text'])?></span>
    <span class="created-at" title="<?=$tweet['created_at']?>"><?=time_ago($tweet['created_at'])?></span>
  </span>
</span>

<?php
}
?></div></body></html>
