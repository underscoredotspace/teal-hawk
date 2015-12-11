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

tweetApp.directive('tweetColumn', function(socket){
  return {
    restrict: 'A', 
    templateUrl: 'tweet-column.html',
    replace: true,
    scope: {tweets: '='},
    controller: function ($scope, $attrs) {
      $scope.tweets = [];
      //console.log($attrs.tweetColumn);
      socket.emit('initRequest', [$attrs.tweetColumn, 200]);
      
      socket.on('reconnect', function(){
        if ($scope.tweets!=[]) {
          console.log('reconnecting column ' + $attrs.tweetColumn + ' ' + $scope.tweets[0].id_str);
          socket.emit('updateRequest', [$attrs.tweetColumn, $scope.tweets[0].id_str]);
        } else {
          socket.emit('initRequest', [$attrs.tweetColumn, 10]);
        }
      });

      socket.on('topTweet', function(newTweet) {    
        if ((newTweet[0]==$attrs.tweetColumn)||(newTweet[0]=='*')){
          acceptTweet = false;
          angular.forEach(JSON.parse($attrs.tweetFilter), function(t_value, t_key){
            if (eval('newTweet[1].' + t_key) == t_value) {
              acceptTweet = true;     
            }
          });
          if (acceptTweet) {
            $scope.tweets.unshift(newTweet[1]);
            $scope.$digest();
            //console.log('topTweet ' + newTweet[1].id_str + ' to ' + $attrs.tweetColumn);
          }
        }
      });

      socket.on('bottomTweet', function(newTweet) {
        if (newTweet[0]==$attrs.tweetColumn){
          acceptTweet = false;
          angular.forEach(JSON.parse($attrs.tweetFilter), function(t_value, t_key){
            if (eval('newTweet[1].' + t_key) == t_value) {
              acceptTweet = true;     
            }
          });
          if (acceptTweet) {
            $scope.tweets.push(newTweet[1]);
            $scope.$digest();
            //console.log('bottomTweet ' + newTweet[1].id_str + ' to ' + $attrs.tweetColumn);
          }
        };  
      });

      $scope.showMore = function() {
        //console.log('Next 10 tweets after ' + $scope.tweets[$scope.tweets.length-1].id + ' please');
        socket.emit('NextTweets', [$attrs.tweetColumn,{last: $scope.tweets[$scope.tweets.length-1].id_str, count: 10}]);
      };
    }
  }
})
