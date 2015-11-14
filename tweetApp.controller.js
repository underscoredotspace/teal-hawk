// Set up of tweetApp module. 
//   Moment used for nice time presentation
//   Animate for visual introduction of new data to view
//   Sanitize ??

var tweetApp = angular.module('tweetApp', ['angularMoment', 'ngAnimate', 'ngSanitize']);

tweetApp.controller('tweetCtrl', function ($scope, $http, $interval, $timeout){
  // Get first 100 tweets from json.php
  $http.get('json.php?count=100').success(function(data) {
    $scope.tweets = data;
  });

  // Set timer to get tweets added to database after newest retrieved above every 5s
  $scope.Timer = $interval(function () {
    // Get latest tweet_id from view
    newest_tweet_id = $scope.tweets[0].tweet_id;
    // Retrieve tweets after newest from view
    $http.get('json.php?tweet_id_after=' + newest_tweet_id).success(function(data) {
      // Only stick more into view if we actually got results
      if(data.length>0){
        //console.log(data.length + ' new tweets');
        for (var i=data.length-1; i>=0; i--){
          $scope.tweets.unshift(data[i]);
        }
      } else {
        //console.log("No new tweets");
      }
    });
  }, 5000);
});
