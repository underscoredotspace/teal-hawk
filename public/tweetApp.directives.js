tweetApp.directive('focusInput', function($timeout) {
  return {
    link: function(scope, element, attrs) {
      element.bind('click', function() {
        $timeout(function() {
          element.parent().find('input')[0].focus();
        });
      });
    }
  };
});

tweetApp.directive('scrollBottom', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var raw = element[0];
            element.bind('scroll', function () {
                if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                    scope.$apply(attrs.scrollBottom);
                }
            });
        }
    };
});

tweetApp.directive('tweetColumn', function(socket){
  return {
    restrict: 'A', 
    templateUrl: 'tweet-column.html',
    replace: true,
    scope: {tweets: '='},
    controller: function ($scope, $attrs) {
      $scope.tweets = [];
      console.log($attrs.tweetColumn);
      socket.emit('initRequest', [$attrs.tweetColumn, 10]);
      
      socket.on('reconnect', function(){
        if ($scope.tweets!=[]) {
          console.log('reconnecting ' + $scope.tweets[0].id_str);
          socket.emit('updateRequest', [$attrs.tweetColumn, $scope.tweets[0].id_str]);
        } else {
          socket.emit('initRequest', [$attrs.tweetColumn, 10]);
        }
      });

      socket.on('topTweet', function(newTweet) {
        console.log('topTweet recieved');
          if (newTweet[0]==$attrs.tweetColumn)||(newTweet[0]=='*'){
            $scope.tweets.unshift(newTweet[1]);
            $scope.$digest();    
          }
      });

      socket.on('bottomTweet', function(newTweet) {
        console.log('bottomTweet recieved');
        if (newTweet[0]==$attrs.tweetColumn){
          $scope.tweets.push(newTweet[1]);
          $scope.$digest();
        }
      });

      $scope.showMore = function() {
        console.log('Next 10 tweets after ' + $scope.tweets[$scope.tweets.length-1].id + ' please');
        socket.emit('NextTweets', [$attrs.tweetColumn,{last: $scope.tweets[$scope.tweets.length-1].id_str, count: 10}]);
      };
    }
  }
})