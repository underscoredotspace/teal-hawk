<?php
require("functions.php");
require("config.php");

$connect = mysqli_connect($sql_host, $sql_user, $sql_pass, $sql_dbname);
$connect->set_charset("utf8mb4");

if (isset($_GET['created_at']) && ($_GET['created_at']!="")) {
  $query_keywords = "AND created_at > '" . escape_mySQL($_GET['created_at']) . "'";
  $tweet_limit = "";
} else {
  $tweet_limit = "DESC LIMIT 300";
}

$result = mysqli_query($connect, "select * from tweets WHERE (is_rt=0 " . $query_keywords . ") order by tweet_id " . $tweet_limit . ";");
$tweets = array();

while ($row = mysqli_fetch_array($result,MYSQLI_ASSOC)) { $tweets[] = $row;}
echo json_encode($tweets);
?>
