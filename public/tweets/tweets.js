tweetApp.controller('tweetDeck', function ($scope, $filter, socket){
  socket.on('connect', function(){
    console.log('connected');
  });

  socket.on('connect_error', function(err){
    console.log('connection error: ' + err);
  });
  
  socket.on('columns', function (columns) {
    if(!angular.equals($scope.columns, columns)){
      console.log('new columns recieved');
      $scope.columns = columns;
      $scope.$apply();
    };
  });
});

tweetApp.directive('focusInput', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      element.bind('click', function() {
        element.parent().find('input')[0].focus();
      });
    }
  };
});

tweetApp.directive('scrollTop', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      element.bind('focus', function() {
        element.parent().parent()[0].scrollTop = 0;
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
        if ((document.activeElement.tagName=='INPUT')&&(raw.scrollTop>0)){
          document.activeElement.blur();
        }
        if (raw.scrollTop + raw.offsetHeight >= (raw.scrollHeight*(1/1.25))) {
          scope.$apply(attrs.scrollBottom);
        }
      });
    }
  };
});

tweetApp.directive('tweetColumn', function(socket){
  return {
    restrict: 'A', 
    templateUrl: 'tweets/tweet-column.html',
    replace: true,
    scope: false,
    require: '^tweetsController',
    controller: function ($scope, $filter) {
      $scope.tweets = [];
      $scope.bottomLoading = false;
      
      var initRequest = function() {
        var tweetColumn = angular.extend({}, {tweetCount: 10}, $scope.column);
        socket.emit('initRequest', tweetColumn);
        console.log('Inital ' + 10 + ' tweets requested for column ' + $scope.column.id);
      };
      
      $scope.$watch('$scope.columns', function() {
        if($scope.columns!=[]) {
          initRequest();
        }
      });
      
      // Fires after connection lost and regained
      socket.on('reconnect', function(){
        console.log('reconnect please');
        if ($scope.tweets!=[]) {
          console.log('reconnecting...');
          var updateRequest = angular.extend({}, {lastTweet: $scope.tweets[0].id_str}, $scope.column);
          socket.emit('updateRequest', updateRequest);
          console.log('Tweets after ' + updateRequest.lastTweet + ' requested for column ' + $scope.column.id);
        } else {
          console.log('reconnected, but not sure how we get here');
          initRequest($scope.column.id);
        }
      });
      
      function removePhotoLink (tweet) {
        if (tweet.extended_entities) {
            if (tweet.extended_entities.media) {
            angular.forEach(tweet.extended_entities.media, function(media_item) {
              if (media_item.type=='photo') {
                tweet.text = tweet.text.replace(media_item.url, '');
              }
            });
            }
          }
      }

      // Fires when new Tweet for top of stack sent by server
      socket.on('topTweet', function(newTweet) {
        if (_.indexOf(newTweet[0],$scope.column.id)!=-1) {
            console.log(newTweet[1].length + ' topTweet(s) recieved for column ' + $scope.column.id);
            $scope.$evalAsync(function(){
              for (var i=newTweet[1].length-1; i>=0; i--){
                removePhotoLink(newTweet[1]);
                $scope.tweets.unshift(newTweet[1][i]);
              }
            });
            $scope.$digest();
          } else {
            console.log('tweet recieved, but not for column ' + $scope.column.id);
          }
      });
      // Fires when new Tweet for bottom of stack sent by server
      socket.on('bottomTweet', function (newTweet) {
        if (newTweet[0]==$scope.column.id){
          console.log(newTweet[1].length + ' bottomTweet(s) recieved for column ' + $scope.column.id);
          $scope.$evalAsync(function () {
            for (var i=0; i<=newTweet[1].length-1; i++) {
              removePhotoLink(newTweet[1][i]);
              $scope.tweets.push(newTweet[1][i]);
            }
          });
          $scope.$digest();
          $scope.bottomLoading = false; // alows showMore function to fire again
        }
      });
      
      // Fires when deletion request is recieved from Twitter via server
      socket.on('deleteTweet', function (id_str) {
        if ($filter('filter')($scope.tweets, {id_str: id_str}).length>0) {
          console.log('Tweet ' + id_str + ' deleted from ' + $scope.column.id);
          $scope.tweets = $filter('filter')($scope.tweets, {id_str: '!' + id_str});
          $scope.$digest();
        }
      })

      // Called by scrollBottom directive when bottom of column is reached by user
      $scope.showMore = function() {
        if (($scope.bottomLoading==false) && (socket.connected)) {
          $scope.bottomLoading = true; // set this to true until we get more bottomTweets. 
          var nextTweets = angular.extend({}, {tweetCount: 10}, {lastTweet: $scope.tweets[$scope.tweets.length-1].id_str}, $scope.column);
          console.log('Next 10 tweets after ' + nextTweets.lastTweet + ' requested');
          socket.emit('NextTweets', nextTweets);
        } else {
          // either waiting already, or disconnected
        }
      };
    }
  }
})