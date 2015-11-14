<!DOCTYPE html>
<html>
<head>
  <!-- Browser set up -->
  <meta charset="utf-8">
  <meta name="viewport" content="width=375">
  <title>AngularHose (teal-hawk)</title>

  <!-- Styles -->
  <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro" rel="stylesheet" type="text/css">
  <link href="style.css" rel="stylesheet" type="text/css">

  <!-- JavaScript -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.5.0-beta.1/angular.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.5.0-beta.1/angular-animate.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.5.0-beta.1/angular-sanitize.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.9.0/moment.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/angular-moment/0.9.0/angular-moment.min.js"></script>
  <script src="tweetApp.controller.js"></script>
  <script src="tweetApp.filters.js"></script>
</head>

<!-- Start of tweetApp -->
<body data-ng-app="tweetApp">
  <!-- tweet-column should have the ability to be duplicated with different follow/track values -->
  <div class="tweet-column" data-ng-controller="tweetCtrl">
    <!-- Search box and info -->
    <span class="search-tweets">
      <input data-ng-model="search.tweet_text" type="text" class="search-tweets" placeholder="Search">
      <button ng-click="search={}">Clear</button>
      <span class="filtered-count">{{filteredtweets.length}} / {{tweets.length}}</span>
    </span>
    <!-- Scrollable container for tweet stream -->
    <div class="tweet-container">
      <span class="tweet" data-ng-repeat="tweet in filteredtweets = (tweets|filter:search|orderBy:tweet_id:reverse)">
        <!-- on the left we currently only have profile image.
             Should have other user stats here, like followers/join data/location etc. -->
        <span class="left-column">
          <img class="profile-image" src="#" data-ng-src="{{tweet.profile_image_url|proxy_image}}" alt="{{tweet.screen_name}}">
        </span>
        <!-- on the right is actual tweet data -->
        <span class="right-column" >
          <span class="user">
            <span class="user-name">{{tweet.name}} </span>
            <span class="user-handle"> {{tweet.screen_name}}</span>
          </span>
          <!-- tweet-text is passed from json without any html encoding, so we need to add it in with filters -->
          <span class="tweet-text" id="tweet-id-{{tweet.tweet_id}}"
            data-ng-bind-html="tweet.tweet_text|linkyUnsanitized|tweetLinky|highlight:search.tweet_text"></span>
          <span class="created-at" title="{{tweet.created_at|amCalendar}}" data-am-time-ago="tweet.created_at"></span>
        </span>
      </span>
    </div>
  </div>
</body>
</html>
