tweetApp.directive('focusInput', function($timeout) {
  return {
    restrict: 'A',
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

tweetApp.directive('tweetColumn', function(socket, $timeout){
  return {
    restrict: 'A', 
    templateUrl: 'tweet-column.html',
    replace: true,
    scope: {tweets: '='},
    controller: function ($scope, $attrs, $filter) {
      $scope.tweets = [];
      $scope.bottomLoading = false;
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
        if ((newTweet[0]==$attrs.tweetColumn)||(newTweet[0]=='*')){
          console.log(newTweet[1].length + ' topTweet(s) recieved for column ' + $attrs.tweetColumn);
          $scope.$evalAsync(function(){
            for (var i=newTweet[1].length-1; i>=0; i--){
              $scope.tweets.unshift(newTweet[1][i]);
            }
          });
          $scope.$digest();
        }
      });

      socket.on('bottomTweet', function(newTweet) {
        if (newTweet[0]==$attrs.tweetColumn){
          $scope.$evalAsync(function(){
            for (var i=0; i<=newTweet[1].length-1; i++){
              $scope.tweets.push(newTweet[1][i]);
            }
          });
          $scope.$digest();
          $scope.bottomLoading = false; // alows showMore function to fire again
        }
      });
      
      socket.on('deleteTweet', function(deleteTweet){
        console.log('Tweet ' + deleteTweet + ' deleted from ' + $attrs.tweetColumn);
        $scope.tweets = $filter('filter')($scope.tweets, {id_str: '!' + deleteTweet});
        $scope.$digest();
      })

      $scope.showMore = function() {
        // not sure if this is the best way to do this, but it works. 
        if ($scope.bottomLoading==false) {
          $scope.bottomLoading = true; // set this to true until we get more bottomTweets
          console.log('Next 10 tweets after ' + $scope.tweets[$scope.tweets.length-1].id_str + ' requested');
          socket.emit('NextTweets', [$attrs.tweetColumn,{last: $scope.tweets[$scope.tweets.length-1].id_str, count: 10}]);
        } else {
          console.log('Can\'t request more yet - still loading');
        }
      };
    }
  }
})