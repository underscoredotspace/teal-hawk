<!DOCTYPE html>
<html>
<head>

<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro" rel="stylesheet" type="text/css">

<style>
<?php include 'v2.css'; ?>
</style>

<script src="http://ajax.googleapis.com/ajax/libs/angularjs/1.4.7/angular.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/moment.js/2.9.0/moment.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/angular-moment/0.9.0/angular-moment.min.js"></script>
<script>
<?php include 'ngTweetApp.js'; ?>
</script>

<title>AngularHose (teal-hawk)</title>

</head>

<body data-ng-app="tweetApp">
  <div class="tweet-container" data-ng-controller="TweetCtrl">
    <span class="search_tweets">
      <input data-ng-model="search.tweet_text" type="text">
    </span><span>{{tweets.length}}</span>
    <span class="tweet" data-ng-repeat="tweet in tweets|filter:search|orderBy:tweet_id:reverse">
      <span class="left-column">
        <img class="profile-image" src="#" data-ng-src="{{tweet.profile_image_url|proxy_image}}" alt="{{tweet.screen_name}}">
      </span>
      <span class="right-column" >
        <span class="user">
          <span class="user-name">{{tweet.name}} </span>
          <span class="user-handle"> {{tweet.screen_name}}</span>
        </span>
        <span class="tweet-text" id="tweet-id-{{tweet.tweet_id}}">{{tweet.tweet_text}}</span>
        <span class="created-at" title="{{tweet.created_at|amCalendar}}" am-time-ago="tweet.created_at"></span>
      </span>
    </span>
  </div>
</html>
