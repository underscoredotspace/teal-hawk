<?php
require("functions.php");
require("config.php");

$connect = mysqli_connect($sql_host, $sql_user, $sql_pass, $sql_dbname);
$connect->set_charset("utf8mb4");
$result = mysqli_query($connect, "select * from tweets WHERE is_rt=0 order by tweet_id DESC LIMIT 100;");
$tweets = array();

while ($row = mysqli_fetch_array($result,MYSQLI_ASSOC)) { $tweets[] = $row;}
echo "[\n";

foreach($tweets as $index => $tweet) {
$tweet['profile_image_url'] = "img.php?url=" . str_replace("http://pbs.twimg.com/profile_images/", "", $tweet['profile_image_url']);

echo "  {\n";
echo "    \"tweet_id\": " . json_encode($tweet['tweet_id']) .",\n";
echo "    \"profile_image_url\": " . json_encode($tweet['profile_image_url']) .",\n";
echo "    \"screen_name\": " . json_encode($tweet['screen_name']) .",\n";
echo "    \"name\": " . json_encode($tweet['name']) .",\n";
echo "    \"tweet_text\": " . json_encode($tweet['tweet_text']) .",\n";
echo "    \"created_at\": " . json_encode($tweet['created_at']) .",\n";
echo "    \"time_ago\": " . json_encode(time_ago($tweet['created_at'])) ."\n";
if ($index==count($tweets)-1) {
  echo "  }\n";
} else {
  echo "  },\n";
}

}
echo "]";
?>
