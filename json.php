<?php
require("functions.php");
require("config.php");

$query_strings = array();

if ((isset($_GET['tweet_id_after']) && isset($_GET['tweet_id_before'])) && ($_GET['tweet_id_after'] > $_GET['tweet_id_before'])) {
  echo "tweet_id_after cannot be less than tweet_id_before";
  exit;
} else {
  if (isset($_GET['tweet_id_after'])) {
    array_push($query_strings, "AND tweet_id > '" . escape_mySQL($_GET['tweet_id_after']) . "' ");
  }
  if (isset($_GET['tweet_id_before']) && $_GET['tweet_id_before']<>"") {
    array_push($query_strings, "AND tweet_id < '" . escape_mySQL($_GET['tweet_id_before']) . "' ");
  }
}

// Validate like this?
//   preg_match("/^([0-9]{17}[0-9]+)$/", $_GET['tweet_id'])

if(ctype_digit($_GET['count']) && $_GET['count']>0) {
  if ($_GET['count']<=1000) {
    $tweet_limit = "DESC LIMIT " . $_GET['count'];
  } else {
    $tweet_limit = "DESC LIMIT 1000";
  }
} else {
  $tweet_limit =  "DESC LIMIT 30";
}

//echo "select * from tweets WHERE (is_rt=0 " . implode(" ", $query_strings) . ") order by tweet_id " . $tweet_limit . ";";
//exit;

  $connect = mysqli_connect($sql_host, $sql_user, $sql_pass, $sql_dbname);
  $connect->set_charset("utf8mb4");
  $result = mysqli_query($connect, "select * from tweets WHERE (is_rt=0 " . implode(" ", $query_strings) . ") order by tweet_id " . $tweet_limit . ";");
  $tweets = array();
  while ($row = mysqli_fetch_array($result,MYSQLI_ASSOC)) { $tweets[] = $row;}
  echo json_encode($tweets);

?>
