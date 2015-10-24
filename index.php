<!DOCTYPE html>
<html>
<head>

<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro" rel="stylesheet" type="text/css">

<style>
<?php include 'v2.css'; ?>
</style>

<script src="http://ajax.googleapis.com/ajax/libs/angularjs/1.2.26/angular.min.js"></script>
<script>
<?php include 'ngTweetApp.js'; ?>
</script>

<title>AngularHose (teal-hawk)</title>

</head>

<body data-ng-app="tweetApp">
  <div class="tweet-container" data-ng-controller="TweetCtrl">
    <span class="tweet" data-ng-repeat="tweet in tweets">
      <span class="left-column">
        <img class="profile-image" src="#" data-ng-src="{{tweet.profile_image_url}}" alt="{{tweet.screen_name}}">
      </span>
      <span class="right-column" >
        <span class="user">
          <span class="user-name">{{tweet.name}}</span>
          <span class="user-handle">{{tweet.screen_name}}</span>
        </span>
        <span class="tweet-text" id="tweet-id-{{tweet.tweet_id}}" data-ng-bind-html="tweet.tweet_text | html"></span>
        <span class="created-at" title="{{tweet.created_at}}">{{tweet.time_ago}}</span>
      </span>
    </span>
  </div>
</body>

</html>
