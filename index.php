<!DOCTYPE html>
<html>
<head>

<meta charset="utf-8">
<meta name=viewport content="width=device-width, initial-scale=1">
<meta name="viewport" content="width=375">
<link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro" rel="stylesheet" type="text/css">

<style>
<?php include 'v2.css'; ?>
</style>

<script src="http://ajax.googleapis.com/ajax/libs/angularjs/1.4.7/angular.min.js"></script>
<script src="http://cdnjs.cloudflare.com/ajax/libs/moment.js/2.9.0/moment.min.js"></script>
<script src="http://cdnjs.cloudflare.com/ajax/libs/angular-moment/0.9.0/angular-moment.min.js"></script>
<script>
<?php include 'ngTweetApp.js'; ?>
</script>

<title>AngularHose (teal-hawk)</title>

</head>

<body data-ng-app="tweetApp">
  <div class="tweet-column" data-ng-controller="TweetCtrl">
    <span class="search-tweets">
      <input data-ng-model="search.tweet_text" type="text" class="search-tweets">
      <span class="filtered-count">{{filteredtweets.length}} / {{tweets.length}}</span>
    </span>
    <div class="tweet-container">
      <span class="tweet" data-ng-repeat="tweet in filteredtweets = (tweets|filter:search|orderBy:tweet_id:reverse)">
        <span class="left-column">
          <img class="profile-image" src="#" data-ng-src="{{tweet.profile_image_url|proxy_image}}" alt="{{tweet.screen_name}}">
        </span>
        <span class="right-column" >
          <span class="user">
            <span class="user-name">{{tweet.name}} </span>
            <span class="user-handle"> {{tweet.screen_name}}</span>
          </span>
          <span class="tweet-text" id="tweet-id-{{tweet.tweet_id}}" data-ng-bind-html="tweet.tweet_text|html"></span>
          <span class="created-at" title="{{tweet.created_at|amCalendar}}" data-am-time-ago="tweet.created_at"></span>
        </span>
      </span>
    </div>
  </div>
</body>
</html>
