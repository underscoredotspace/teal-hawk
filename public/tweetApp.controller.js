// Set up of tweetApp module. 
//   Moment used for nice time presentation
//   Animate for visual introduction of new data to view

var tweetApp = angular.module('tweetApp', ['angularMoment', 'ngAnimate', 'ngSanitize']);

tweetApp.factory('socket', function(){
  var socket = io.connect(location.host)
  return socket;
});

tweetApp.controller('tweetCtrl', function ($scope, $filter, socket){
  $scope.tweets = []

  socket.emit('initRequest', 10);

  socket.on('reconnecting', function(){
    if ($scope.tweets!=[]) {
      console.log('reconnecting' + $scope.tweets[0].id);
      socket.emit('updateRequest', $scope.tweets[0].id);
    } else {
      socket.emit('initRequest', 10);
    }
  });

  socket.on('updateResult', function(newTweets) {    
      $scope.tweets.unshift(newtweet);
      $scope.$digest();    
  });
  
  socket.on('tweet', function(newtweet) {
      $scope.tweets.unshift(newtweet);
      $scope.$digest();
  });

  socket.on('tweetinit', function(newtweet) {
    $scope.tweets.push(newtweet);
    $scope.$digest();
  });
});
