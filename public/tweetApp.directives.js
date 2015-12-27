tweetApp.directive('focusInput', function($timeout) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      element.bind('click', function() {
        element.parent().find('input')[0].focus();
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
        if (document.activeElement.tagName=='INPUT'){
          document.activeElement.blur();
        }
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
    scope: false,
    require: '^tweetController',
    controller: function ($scope, $filter) {  
      $scope.tweets = [];
      $scope.bottomLoading = false;
      
      initRequest = function(columnID) {
        socket.emit('initRequest', {
          tweetColumn: columnID, 
          tweetCount: 10
        });
        console.log('Inital ' + 10 + ' tweets requested for column ' + columnID);
      };
      
      $scope.$watch('$scope.columns', function() {
        if($scope.columns!=[]) {
          initRequest($scope.column.id);
        }
      });
      
      // Fires after connection lost and regained
      socket.on('reconnect', function(){
        if ($scope.tweets!=[]) {
          console.log('reconnecting...');
          socket.emit('updateRequest', {
            tweetColumn: $scope.column.id,
            lastTweet: $scope.tweets[0].id_str
          });
          console.log('Tweets after ' + $scope.tweets[0].id_str + ' requested for column ' + $scope.column.id);
        } else {
          console.log('reconnected, but not sure how we get here');
          initRequest($scope.column.id);
        }
      });

      // Fires when new Tweet for top of stack sent by server
      socket.on('topTweet', function(newTweet) {
        if ((newTweet[0]==$scope.column.id)||(newTweet[0]=='*')){
          console.log(newTweet[1].length + ' topTweet(s) recieved for column ' + $scope.column.id);
          $scope.$evalAsync(function(){
            for (var i=newTweet[1].length-1; i>=0; i--){
              $scope.tweets.unshift(newTweet[1][i]);
            }
          });
          $scope.$digest();
        }
      });

      // Fires when new Tweet for bottom of stack sent by server
      socket.on('bottomTweet', function(newTweet) {
        if (newTweet[0]==$scope.column.id){
          console.log(newTweet[1].length + ' bottomTweet(s) recieved for column ' + $scope.column.id);
          $scope.$evalAsync(function(){
            for (var i=0; i<=newTweet[1].length-1; i++){
              $scope.tweets.push(newTweet[1][i]);
            }
          });
          $scope.$digest();
          $scope.bottomLoading = false; // alows showMore function to fire again
        }
      });
      
      // Fires when deletion request is recieved from Twitter via server
      socket.on('deleteTweet', function(id_str){
        console.log('Tweet ' + id_str + ' deleted from ' + $scope.column.id);
        $scope.tweets = $filter('filter')($scope.tweets, {id_str: '!' + id_str});
        $scope.$digest();
      })

      // Called by scrollBottom directive when bottom of column is reached by user
      $scope.showMore = function() {
        if ($scope.bottomLoading==false) {
          $scope.bottomLoading = true; // set this to true until we get more bottomTweets. 
          var lastTweet = $scope.tweets[$scope.tweets.length-1].id_str;
          console.log('Next 10 tweets after ' + lastTweet + ' requested');
          socket.emit('NextTweets', {
            lastTweet: lastTweet,
            tweetColumn: $scope.column.id,
            tweetCount: 10
          });
        } else {
          console.log('Can\'t request more yet - still loading');
        }
      };
    }
  }
})