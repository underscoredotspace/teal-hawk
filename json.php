<?php
require("functions.php");
require("config.php");

if (isset($_GET['created_after']) && (isset($_GET['created_before']))) {
    echo "this doesn't work yet";
    exit;
}

if (isset($_GET['created_after']) && ($_GET['created_after']!="")) {
  $query_keywords = "AND tweet_id > '" . escape_mySQL($_GET['created_after']) . "'";
}

if (isset($_GET['created_before']) && ($_GET['created_before']!="")) {
  $query_keywords = "AND tweet_id < '" . escape_mySQL($_GET['created_before']) . "'";
}

if (isset($_GET['count']) && ($_GET['count']!="")) {
  $tweet_limit = "DESC LIMIT " . escape_mySQL($_GET['count']);
} else {
  $tweet_limit = "DESC LIMIT 30";
}

$connect = mysqli_connect($sql_host, $sql_user, $sql_pass, $sql_dbname);
$connect->set_charset("utf8mb4");
$result = mysqli_query($connect, "select * from tweets WHERE (is_rt=0 " . $query_keywords . ") order by tweet_id " . $tweet_limit . ";");
$tweets = array();

while ($row = mysqli_fetch_array($result,MYSQLI_ASSOC)) { $tweets[] = $row;}
echo json_encode($tweets);
?>
