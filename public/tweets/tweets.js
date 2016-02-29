tweetApp.controller('tweetDeck', function ($scope, $filter, socket, $routeParams){
  if ($routeParams.param == 'reload') {socket.emit('reload', []);}
  
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
      $scope.settingsVisible = false;
      
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
});

tweetApp.directive('addTweetColumn', function(){
  return {
    restrict: 'A', 
    templateUrl: '/tweets/add-column.html',
    replace: true, 
    controller: function($scope) {
      $scope.tos = [{user: ''}];
      $scope.froms = [{user: ''}];
      
      $scope.addTo = function () {
        $scope.tos.push({user: ''});
      };
      $scope.addFrom = function () {
        $scope.froms.push({user: ''});
      };
      $scope.delTo = function (index) {
        if ($scope.tos.length!=1) {$scope.tos.splice(index,1);}
      };
      $scope.delFrom = function (index) {
        if ($scope.froms.length!=1) {$scope.froms.splice(index,1);}
      };
      
      $scope.addColumn = function () {
        var tos = _.uniq(_.compact(_.pluck($scope.tos, 'user')));
        var froms = _.uniq(_.compact(_.pluck($scope.froms, 'user')));
        console.log(JSON.stringify(object2mongo({to: tos, from: froms})));
      }
      
      function object2mongo (raw) {
        var errors = [];
        var mongoQuery = {};
        var queryTo = {};
        var queryFrom = {};
        
        raw = _.extend({from: [], to: []}, raw);
        console.log(JSON.stringify(raw));
        
        if ((raw.from.length==0) && (raw.to.length==0)) {
          errors.push('one or more of "to" or "from" property required');
        } else {
        
          if (raw.hasOwnProperty('to')) {
            // if raw.to isn't valid, push error text
            if (Array.isArray(raw.to) && (raw.to.length>1)) {
              queryTo = {"entities.user_mentions":{"$elemMatch":{"id_str":{"$in":raw.to}}}};
            } else if (Array.isArray(raw.to)) {
              queryTo = {"entities.user_mentions":{"$elemMatch":{"id_str":raw.to[0]}}};
            }
          }
          
          if (raw.hasOwnProperty('from')) {
            // if raw.from isn't valid, push error text
            if (Array.isArray(raw.from) && (raw.from.length>1)) {
              queryFrom = {"user.id_str":{"$in":raw.from}};
            } else if (Array.isArray(raw.from)) {
              queryFrom = {"user.id_str":raw.from[0]};
            }
          }
          
          console.log(JSON.stringify(raw));
          
          if ((raw.from.length>0) && (raw.to.length==0)) {
            mongoQuery = queryFrom;
          } else if ((raw.to.length>0) && (raw.from.length==0)) {
            mongoQuery =  queryTo;
          // } else if ((raw.to.length==0) && (raw.from.length==0)) {
          //   errors.push('one or more of "to" or "from" property required');
          } else {
            mongoQuery =  {"$or": [queryFrom, queryTo]};
          }
        }
        
        if (errors.length==0) {
          return {mongoQuery: mongoQuery};
        } else {
          return {errors: errors};
        }
      }
      
      // staging data only
      $scope.listen_users = [
        {
          id_str: '42383066',
          screen_name: '_DotSpace' 
        },{
          id_str: '284540385',
          screen_name: 'NatWest_Help' 
        },{
          id_str: '284537825',
          screen_name: 'RBS_Help' 
        },
      ]
    }
  }
});