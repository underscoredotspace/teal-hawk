<html ng-app="tweetApp">
<head>

<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro" rel="stylesheet" type="text/css">
<link rel="stylesheet" type="text/css" href="v2.css">

<title>AngularHose (teal-hawk)</title>

<script src="http://ajax.googleapis.com/ajax/libs/angularjs/1.2.26/angular.min.js"></script>
<script src="ngTweetApp.js"></script>
</head>

<body ng-controller="TweetCtrl">
  <div class="tweet-container">
    <span class="tweet" ng-repeat="tweet in tweets">
      <span class="left-column">
        <img class="profile-image" src="{{tweet.profile_image_url}}" alt="{{tweet.screen_name}}">
      </span>
      <span class="right-column" >
        <span class="user">
          <span class="user-name">{{tweet.name}}</span>
          <span class="user-handle">{{tweet.screen_name}}</span>
        </span>
        <span class="tweet-text" id="tweet-id-{{tweet.tweet_id}}" ng-bind-html="tweet.tweet_text | html"></span>
        <span class="created-at" title="{{tweet.created_at}}">{{tweet.time_ago}}</span>
      </span>
    </span>
  </div>
</body>

</html>
