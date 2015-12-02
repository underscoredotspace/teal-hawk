// Set up of tweetApp module. 
//   Moment used for nice time presentation
//   Animate for visual introduction of new data to view

var tweetApp = angular.module('tweetApp', ['angularMoment', 'ngAnimate', 'ngSanitize']);

tweetApp.factory('socket', function(){
  var socket = io.connect('http://' + location.hostname + ':' + location.port)
  console.log(location);
  return socket;
});

tweetApp.controller('tweetCtrl', function ($scope, $filter, socket){
  $scope.tweets = []
  
  // tweet.entities.media.length

  socket.emit('initRequest', 10);

  socket.on('reconnect', function(){
    if ($scope.tweets!=[]) {
      console.log('reconnecting ' + $scope.tweets[0].id_str);
      socket.emit('updateRequest', $scope.tweets[0].id_str);
    } else {
      socket.emit('initRequest', 10);
    }
  });

  socket.on('topTweet', function(newTweet) {    
    console.log('topTweet recieved');
      $scope.tweets.unshift(newTweet);
      $scope.$digest();    
  });
  
  socket.on('bottomTweet', function(newTweet) {
    console.log('bottomTweet recieved');
    $scope.tweets.push(newTweet);
    $scope.$digest();
  });

  $scope.showMore = function() {
    console.log('Next 10 tweets after ' + $scope.tweets[$scope.tweets.length-1].id + ' please');
    socket.emit('NextTweets', {last: $scope.tweets[$scope.tweets.length-1].id_str, count: 10});
  };
});
