tweetApp.directive("tweetDeck", function() {
  return {
    restrict: 'C', 
    templateUrl: 'tweets/th-tweet-deck.html',
    replace: true, 
    scope: false,
    controller: function($scope, $filter, socket) {
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
      
      $scope.$on('newColumn', function () {   
        // create semi-uuid 
        var newID = Math.random().toString(36).substr(2, 4);
        while (_.where($scope.columns, {id: newID}).length!=0) {
          newID = Math.random().toString(36).substr(2, 4);
        }
        
        if ($scope.columns.length != 0) {
          newPosition = _.max($scope.columns, 'position').position + 1;
        } else {
          newPosition = 1;
        }
        
        // create new tweet column with no params
        $scope.columns.push({
          id: newID,
          parameters: '',
          position: newPosition,
          type: "tweetColumn"
        });
        console.log('new column ' + newID + ' created');
      });
      
      // When we move away from the Deck, turn listeners off, to prevent duplication when we come back. 
      $scope.$on('$destroy', function (event) {
        socket.removeAllListeners();
      });
    }
  }
});

// When you click a button, this puts focus back to the appropriate input box
tweetApp.directive('tweetSearchClear', function() {
  return {
    restrict: 'C',
    link: function(scope, element, attrs) {
      element.bind('click', function() {
        element.parent().find('input')[0].focus();
      });
    }
  };
});

// Hack to scroll to top of tweet column when search box focused. Thanks Apple. 
tweetApp.directive('searchTweetsInput', function() {
  return {
    restrict: 'C',
    link: function(scope, element, attrs) {
      element.bind('focus', function() {
        element.parent().parent()[0].scrollTop = 0;
      });
    }
  };
});

// Detect when tweets column is scrolled
tweetApp.directive('tweets', function () {
  return {
    restrict: 'C',
    link: function (scope, element, attrs) {
      var raw = element[0];
      element.bind('scroll', function () {
        // If column not scrolled to near top of tweets column then ask that new tweets don't burst in
        scope.viewBurstMode(raw.scrollTop<25);

        // This un-focuses the search box when we scroll down. Related to scrollTop hack
        if ((document.activeElement.tagName=='INPUT')&&(raw.scrollTop>0)){
          document.activeElement.blur();
        }
        
        // Detects when we're getting to the bottom of the tweet column so we can request more tweets
        if (raw.scrollTop + raw.offsetHeight >= (raw.scrollHeight*(1/1.25))) {
          scope.showMore();
        }
      });
    }
  };
});

tweetApp.directive('thTweetSearch', function() {
  return {
    restrict: 'C',
    templateUrl: 'tweets/th-tweet-search.html',
    replace: true, 
    scope: false
  }
})

tweetApp.directive('thTweet', function() {
  return {
    restrict: 'C',
    templateUrl: 'tweets/th-tweet.html',
    replace: true, 
    scope: false
  }
})

tweetApp.directive('tweetColumn', function(socket){
  return {
    restrict: 'C', 
    templateUrl: 'tweets/th-tweet-column.html',
    replace: true,
    scope: false,
    controller: function ($scope, $filter) {
      $scope.tweets = [];
      $scope.bottomLoading = false;
      $scope.viewBursting = true;
      
      var initRequest = function() {
          var tweetColumn = {tweetCount: 10, id: $scope.column.id, parameters: $scope.column.parameters};
          socket.emit('initRequest', tweetColumn);
          console.log('Inital ' + 10 + ' tweets requested for column ' + $scope.column.id);
      };
      
      $scope.$watch('$scope.column', function() {
        if(($scope.column!=[]) && (!angular.equals($scope.column.parameters, ''))) {
          initRequest();
        };
      });
      
      // Fired back once new column added to database, following newColumn socket event in addTweetColumn
      // Lets us know when to load tweets into new column
      socket.on('columnAdded', function(columnID) {
        resetColumn(columnID);
      });
      
      // Fired when column parameters are amended. 
      $scope.$on('columnUpdated', function(event, columnID) {
        resetColumn(columnID);
      });
      
      function resetColumn (columnID) {
        if(columnID==$scope.column.id) {
          $scope.tweets = [];
          initRequest();
        }
      }
      
      // Fires after connection lost and regained
      socket.on('reconnect', function(){
        console.log('Reconnect please');
        if ($scope.tweets.length!=0) {
          var updateRequest = {lastTweet: $scope.tweets[0].id_str, id: $scope.column.id, parameters: $scope.column.parameters}
          socket.emit('updateRequest', updateRequest);
          console.log('Tweets after ' + updateRequest.lastTweet + ' requested for column ' + $scope.column.id);
        } else {
          initRequest();
        }
      });
      
      // Since we're showing photos within tweet, removes the t.co links in tweet.text
      function removePhotoLink (tweet) {
        if (tweet.extended_entities) {
          if (tweet.extended_entities.media) {
            _.each(tweet.extended_entities.media, function(media_item) {
              if (media_item.type=='photo') {
                tweet.text = tweet.text.replace(media_item.url, '');
              }
            });
          }
        }
      }
      
      // Since we're showing quoted_status within tweet, removes the t.co links in tweet.text
      function removeQuotedLink (tweet) {
        if (tweet.quoted_status) {
          if (tweet.entities.urls) {
            _.each(tweet.entities.urls, function(url_item) {
              if (url_item.display_url.substr(0, 12) =='twitter.com/') {
                tweet.text = tweet.text.replace(url_item.url, '');
              }
            });
          }
        }
      }

      // Fires when new Tweet for top of stack sent by server
      socket.on('topTweet', function(newTweet) {
        newTweets = _.query(newTweet, JSON.parse($scope.column.parameters));
        if(newTweets.length>0) {
          console.log(newTweets.length + ' topTweet(s) recieved for column ' + $scope.column.id);
          _.each(newTweets.reverse(), function(tweet) {
            removePhotoLink(tweet);
            removeQuotedLink(tweet);
            $scope.tweets.unshift(tweet);
          });
          $scope.$digest();
        }        
      });
      // Fires when new Tweet for bottom of stack sent by server
      socket.on('bottomTweet', function (newTweet) {
        if (newTweet[0]==$scope.column.id){
          console.log(newTweet[1].length + ' bottomTweet(s) recieved for column ' + $scope.column.id);
          _.each(newTweet[1], function(tweet) {
            // check it isn't already in view
            if (_.findWhere($scope.tweets, {id_str: tweet.id_str})==undefined) {
              removePhotoLink(tweet);
              removeQuotedLink(tweet);
              $scope.tweets.push(tweet);
            }
          });
          $scope.bottomLoading = false; // alows showMore function to fire again
          $scope.$digest();
        }
      });
      
      // Fires when deletion request is recieved from Twitter via server
      socket.on('deleteTweet', function (id_str) {
        if (_.findWhere($scope.tweets, {id_str: id_str})!=undefined) {
          console.log('Tweet ' + id_str + ' deleted from ' + $scope.column.id);
          $scope.tweets = $filter('filter')($scope.tweets, {id_str: '!' + id_str});
          $scope.$digest();
        }
      })
      
      $scope.viewBurstMode = function(viewBursting) {
        if ($scope.viewBursting!=viewBursting) {
          $scope.viewBursting=viewBursting;
          console.log($scope.column.id + ' view-burst: ' + viewBursting); 
        }
      }

      // Called by scrollBottom directive when bottom of column is approached by user. Loads more tweets. 
      $scope.showMore = function() {
        if (($scope.bottomLoading==false) && (socket.connected)) {
          $scope.bottomLoading = true; // set this to true until we get more bottomTweets. 
          var nextTweets = {tweetCount: 10, lastTweet: $scope.tweets[$scope.tweets.length-1].id_str, id: $scope.column.id, parameters: $scope.column.parameters};
          console.log('Next 10 tweets after ' + nextTweets.lastTweet + ' requested');
          socket.emit('NextTweets', nextTweets);
        } else {
          // either waiting already, or disconnected
        }
      };
    }
  }
});

// Directive that enables us to create[/amend] criteria for new column, move column or delete column. 
tweetApp.directive('thTweetConfig', function(socket, $filter){
  return {
    restrict: 'C', 
    templateUrl: '/tweets/th-tweet-config.html',
    replace: true, 
    controller: function($scope, $rootScope, paramsParse) {
      $scope.setupSettings = function() {
        if($scope.column.isNew) {
          $scope.tos = [{user: ''}];
          $scope.froms = [{user: ''}];
        } else {
          objectArray = paramsParse.mongo2object(JSON.parse($scope.column.parameters));
          $scope.tos = [];
          _.each(objectArray.to, function(element){
            $scope.tos.push({user: element});
          });
          if ($scope.tos.length === 0) {
            $scope.tos.push({user: ''});
          }
          
          $scope.froms = [];
          _.each(objectArray.from, function(element){
            $scope.froms.push({user: element});
          });
          if ($scope.froms.length === 0) {
            $scope.froms.push({user: ''});
          }
        }
        
        $scope.addTo = function () {
          $scope.tos.push({user: ''});
        };
        $scope.addFrom = function () {
          $scope.froms.push({user: ''});
        };
      }
      
      $scope.delTo = function (index) {
        if ($scope.tos.length!=1) {
          $scope.tos.splice(index,1);
        } else {
          $scope.tos[0].user = '';
        }
      };
      $scope.delFrom = function (index) {
        if ($scope.froms.length!=1) {
          $scope.froms.splice(index,1);
        } else {
          $scope.froms[0].user = '';
        }
      };
      
      $scope.moveColumnLeft = function () {
        if ($scope.column.position==_.min($scope.columns, 'position').position) {
          console.log('already as left as we can go!'); // Should be toast for user
        } else {
          // move column left
          var thisColumn = _.indexOf(_.pluck($scope.columns, 'position'), $scope.column.position);
          var leftColumn = _.indexOf(_.pluck($scope.columns, 'position'), $scope.column.position-1);
          console.log(thisColumn, leftColumn);
          var leftPosition = $scope.columns[leftColumn].position;
          $scope.columns[leftColumn].position = $scope.columns[thisColumn].position;
          $scope.columns[thisColumn].position = leftPosition;
          // update server
          socket.emit('editColumn', {id: $scope.column.id, parameters: $scope.column.parameters, position: $scope.column.position, type: $scope.column.type});
          socket.emit('editColumn', {id: $scope.columns[leftColumn].id, parameters: $scope.columns[leftColumn].parameters, position: $scope.columns[leftColumn].position, type: $scope.columns[leftColumn].type});
        }
      }
      $scope.moveColumnRight = function () {
        if ($scope.column.position==_.max($scope.columns, 'position').position) {
          console.log('already as right as we can go!'); // Should be toast for user
        } else {
          // move column right
          var thisColumn = _.indexOf(_.pluck($scope.columns, 'position'), $scope.column.position);
          var rightColumn = _.indexOf(_.pluck($scope.columns, 'position'), $scope.column.position+1);
          var rightPosition = $scope.columns[rightColumn].position;
          $scope.columns[rightColumn].position = $scope.columns[thisColumn].position;
          $scope.columns[thisColumn].position = rightPosition;
          // update server
          socket.emit('editColumn', {id: $scope.column.id, parameters: $scope.column.parameters, position: $scope.column.position, type: $scope.column.type});
          socket.emit('editColumn', {id: $scope.columns[rightColumn].id, parameters: $scope.columns[rightColumn].parameters, position: $scope.columns[rightColumn].position, type: $scope.columns[rightColumn].type});
        }
      }
      
      $scope.toggleSettings =  function() {
        if ($scope.column.parameters==='') {
          $scope.column.isNew = true;
        } else {
          $scope.column.isNew = false;
        }
        $scope.settingsVisible = !$scope.settingsVisible;
        $scope.setupSettings();
        
        if(!$scope.settingsVisible && $scope.column.parameters === '') {
          $scope.$parent.columns = $filter('filter')($scope.columns, {id: '!' + $scope.column.id});
          $scope.column = [];
        }
      }
      
      if(angular.equals($scope.column.parameters, '')) {
        $scope.toggleSettings();
      }
      
      $scope.addColumn = function () {
        var tos = _.uniq(_.compact(_.pluck($scope.tos, 'user')));
        var froms = _.uniq(_.compact(_.pluck($scope.froms, 'user')));
        if (!((tos.length===0) && (froms.length===0))) {
          $scope.column.parameters = JSON.stringify(paramsParse.object2mongo({to: tos, from: froms}));
          socket.emit('newColumn', {id: $scope.column.id, parameters: $scope.column.parameters, position: $scope.column.position, type: $scope.column.type});
          $scope.toggleSettings();
        } else {
          console.log('One or more users must be selected under Tweets and/or Mentions');
          // toast error message
        }
      }
      
      $scope.updateColumn = function() {
        // uniq to remove duplicates, and compact to remove ''. 
        var tos = _.uniq(_.compact(_.pluck($scope.tos, 'user')));
        var froms = _.uniq(_.compact(_.pluck($scope.froms, 'user')));
        newParams = JSON.stringify(paramsParse.object2mongo({to: tos, from: froms}));
        if (!_.isEqual(newParams, $scope.column.parameters)) {
          if (!((tos.length===0) && (froms.length===0))) {
            $scope.column.parameters = newParams;
            socket.emit('editColumn', {id: $scope.column.id, parameters: $scope.column.parameters, position: $scope.column.position, type: $scope.column.type});
            $scope.toggleSettings();
            $rootScope.$broadcast('columnUpdated', $scope.column.id);
          } else {
            console.log('One or more users must be selected under Tweets and/or Mentions');
            // toast error message
          }
        } else {
          console.log('Parameters haven\'t changed!');
          // toast error message
        }
      }
      
      $scope.delColumn = function() {
        socket.emit('delColumn', $scope.column.id);
        deletedPosition = $scope.column.position;
        $scope.$parent.columns = $filter('filter')($scope.columns, {id: '!' + $scope.column.id});
        $scope.column = [];
        $scope.tweets = [];
        angular.forEach($scope.$parent.columns, function(element, index) {
          if (element.position > deletedPosition) {
            $scope.$parent.columns[index].position = $scope.$parent.columns[index].position -1;
            socket.emit('editColumn', {id: $scope.columns[index].id, parameters: $scope.columns[index].parameters, position: $scope.columns[index].position, type: $scope.columns[index].type});
          } 
        });
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