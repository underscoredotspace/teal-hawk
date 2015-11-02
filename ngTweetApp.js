/*
 NOTE: The state of development here (at the moment) is "if it comiles, ship it". 

 In a nutshell, tweetApp will get 10 tweets, render them in view, get another 90 tweets, stick them at the bottom of the view. 
 A timer then fires every 10 seconds to check for new tweets, and sticks them at the top of the view. 
 TODO - Learn how to fucking Function with multiple params. Learn how to build a Service or Factory for $http.get(). 
        This can probably be rewritten in about 10 lines
*/ 

var tweetApp = angular.module('tweetApp', ['angularMoment']);    // Is this the best set up for this? doesn't feel like it. 
tweetApp.controller('TweetCtrl', function ($scope, $http, $interval, $timeout){
  // Get initial 20 tweets using json.php
  $http.get('json.php?count=20').success(function(data) {
    $scope.tweets = data;

    // HACK to wait until first 20 tweets have rendered in view
    $timeout(function() {
      // TODO - remove duplication with Factory/Service
      // Get next 80 tweets and push them to the end of tweets
      $http.get('json.php?count=80&tweet_id_before=' + $scope.tweets[$scope.tweets.length-1].tweet_id).success(function(data) {
        if(data.length>0) {
          for (var i=0; i<data.length; i++) {
            $scope.tweets.push(data[i]);
          }
        }
      });
    },0);
  });

  // Last 80 tweets left to render at their leisure. 
  // TODO - Does $scope.Timer wait for last lot of tweets to render or are we just luck with 10 second wait? 
  $scope.Timer = $interval(function () {
     $http.get('json.php?tweet_id_after=' + $scope.tweets[0].tweet_id).success(function(data) {
      if(data.length>0){
        for (var i=data.length-1; i>=0; i--){
          $scope.tweets.unshift(data[i]);
        }
      } else {console.log("No new tweets");}
    });
  }, 10000);
});

// Tells view to accept tweet_text as html. Not used now, and not sure it will be again. 
tweetApp.filter('html', ['$sce', function ($sce) { 
  return function (text) {
    return $sce.trustAsHtml(text);
  };  
}])

// Proxies profile images, but should be able to handle any image with little work. 
tweetApp.filter('proxy_image', function() {
  return function(text) {
    var out = "";
    // to catch new egg profile pics
    if (text.search("http://abs.twimg.com") >-1) {
      out = "img.php?url=" + text; 
    } else {
      // to catch normal profile images
      out = text.replace("http://pbs.twimg.com/profile_images/", "img.php?url=");
    }
    return out;
  };
})
