var tweetApp = angular.module('tweetApp', ['angularMoment', 'ngAnimate']).constant('_', window._);

tweetApp.directive("tweetDeck", function($timeout, socket, thToast) {
  return {
    restrict: 'C', 
    templateUrl: 'tweets/th-tweet-deck.html',
    replace: true, 
    scope: false,
    link: function(scope, element) {
      socket.on('connect', function(){
        console.log('connected');
      });

      socket.on('connect_error', function(err){
        thToast.newToast('Connection error', 'fail');
        console.log('connection error: ' + err);
      });
      
      socket.on('columns', function (columns) {
        if(!angular.equals(scope.columns, columns)){
          console.log('new columns recieved');
          scope.columns = columns;
          scope.$apply();
        };
      });

      scope.$on('newColumn', function() {
        if (_.max(scope.columns, 'position').parameters!='') {
          // create semi-uuid 
          var newID = Math.random().toString(36).substr(2, 4);
          while (_.where(scope.columns, {id: newID}).length!=0) {
            newID = Math.random().toString(36).substr(2, 4);
          }
          
          if (scope.columns.length != 0) {
            newPosition = _.max(scope.columns, 'position').position + 1;
          } else {
            newPosition = 1;
          }
          
          // create new tweet column with no params
            scope.columns.push({
              id: newID,
              parameters: '',
              position: newPosition,
              type: "tweetColumn"
          });
          console.log('new column ' + newID + ' created');

          $timeout(function() {
            element[0].scrollLeft=element[0].scrollWidth;
          }, 0);
        }
      })
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
        if (raw.scrollTop + raw.offsetHeight >= (raw.scrollHeight-300)) {
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
});

tweetApp.directive('thTweet', function($timeout) {
  return {
    restrict: 'C',
    templateUrl: 'tweets/th-tweet.html',
    replace: true, 
    scope: false
  }
});

tweetApp.directive('tweetColumn', function(socket){
  return {
    restrict: 'C', 
    templateUrl: 'tweets/th-tweet-column.html',
    replace: true,
    scope: false,
    controller: function ($scope, $filter, $rootScope) {
      $scope.tweets = [];
      $scope.bottomLoading = true;
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
        }
      }

      // Called by scrollBottom directive when bottom of column is approached by user. Loads more tweets. 
      $scope.showMore = function() {
        if (($scope.bottomLoading==false) && (socket.connected)) {
          $scope.bottomLoading = true; // set this to true until we get more bottomTweets. 
          $scope.$apply();
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
tweetApp.directive('thTweetConfig', function(){
  return {
    restrict: 'C', 
    templateUrl: '/tweets/th-tweet-config.html',
    replace: true, 
    controller: function($scope, paramsParse, socket, $filter, $rootScope, thToast) {
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
          thToast.newToast('Can\t go any further left!');
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
          thToast.newToast('Can\t go any further right!');
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
          thToast.newToast('A selection must be made', 'fail');
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
            thToast.newToast('A selection must be made', 'fail');
            // toast error message
          }
        } else {
          thToast.newToast('Parameters haven\'t changed', 'warn');
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

tweetApp.factory('socket', function(){
  var socket = io.connect();
  return socket;
});

tweetApp.directive('thHover', function($timeout) {
  return {
    restrict: 'A',
    scope: true,
    link: function(scope, element, attrs) {
      element.on('mouseenter', function(event) {
        element.addClass('hover');
      });
      element.on('mouseleave', function(event) {
        element.removeClass('hover');
      });

      element.on('click', function(event) {
        element.removeClass('hover');
      });
      element.on('mousemove', function(event) {
        element.addClass('hover');
      });
    }
  }
});

tweetApp.service('thToast', function($rootScope) {
  return {
    newToast: function(message, type) {
      if(type==undefined) {
        type = 'info';
      }

      if(message==undefined) {
        $rootScope.$broadcast('newToast', {type: 'fail', message: 'Invalid toast recieved'});
      } else {
        $rootScope.$broadcast('newToast', {type: type, message: message});
      }
    }
  }
})

tweetApp.directive('thToastMessages', function($timeout, $filter) {
  return {
    restrict: 'C',
    scope: false,
    controller: function($scope) {
      $scope.toasts = [];
      function deleteToast(message) {
        index = _.indexOf(_.pluck($scope.toasts, 'id'), message);
        if (index != -1) {
          $scope.toasts.splice(index, 1);
        }
      }

      $scope.$on('deleteToast', function (event, message) {
        deleteToast(message);
        $scope.$digest();
      });

      $scope.$on('newToast', function (event, toast) { 
        var newID = Math.random().toString(36).substr(2, 4);
        while (_.where($scope.toasts, {id: newID}).length!=0) {
          newID = Math.random().toString(36).substr(2, 4);
        }
        $timeout(function() {
          $scope.toasts.push({
            id: newID,
            text: toast.message,
            type: toast.type
          });
        });

        $timeout(function () {
          deleteToast(newID);
        }, 5000);
      });
    }
  }
});

tweetApp.directive('thToastMessage', function($rootScope) {
  return {
    restrict: 'C', 
    scope: false,
    link: function(scope, element, attrs) {
      element.on('click', function() {
        $rootScope.$broadcast('deleteToast', scope.toast.id);
      })
    },
  }
})

tweetApp.directive('menuBar', function($rootScope) {
  return {
    restrict: 'A', 
    templateUrl: '/menu-bar',
    replace: true, 
    link: function(scope) {
      scope.newColumn = function() {
        $rootScope.$broadcast('newColumn', '');
        document.activeElement.blur();
      }
    }
  }
});

tweetApp.directive('goThere', function($window){
  return {
    restrict: 'A', 
    link: function(scope, element, attrs) {
      element.bind('click', function () {
        scope.$apply(function () {
          window.location.href = attrs.goThere;
          document.activeElement.blur();
        });
      });
    }
  }
});

tweetApp.filter('highlight', function () {
  return function(text, phrase) {
    if (phrase) {
      phrase = phrase.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      text = text.replace(new RegExp('('+phrase+')(?![^<]*>)', 'gim'), '<span class="highlighted">$1</span>');
    }
    return text;
  }   
});

// Filter to replace t.co links with the real path
tweetApp.filter('replaceURLs', function () {
  return function(text, urls) {
    // text is tweet.text string
    // urls is tweet.entities.urls array
    
    return text;
  }   
});

// Filter to replace text @mentions with links
tweetApp.filter('replaceMentions', function () {
  return function(text, mentions) {
    // text is tweet.text string
    // urls is tweet.entities.mentions array
    
    return text;
  }   
});

tweetApp.filter('trustHTML', ['$sce', function ($sce) { 
  return function (text) {
    return $sce.trustAsHtml(text);
  };    
}])

// Below is not created by me, and is just ngSanitize Linky function with no sanitation
tweetApp.filter('linkyUnsanitized', function() {  
  var LINKY_URL_REGEXP = /((ftp|https?):\/\/|(mailto:)?[A-Za-z0-9._%+-][^\.\s]+@)\S*[^\s.;,(){}<>]/,  
      MAILTO_REGEXP = /^mailto:/;  
  
  return function(text, target) {  
    if (!text) return text;  
    var match;  
    var raw = text;  
    var html = [];  
    var url;  
    var i;  
    while ((match = raw.match(LINKY_URL_REGEXP))) {  
      // We can not end in these as they are sometimes found at the end of the sentence  
      url = match[0];  
      // if we did not match ftp/http/mailto then assume mailto  
      if (match[2] == match[3]) url = 'mailto:' + url;  
      i = match.index;  
      addText(raw.substr(0, i));  
      addLink(url, match[0].replace(MAILTO_REGEXP, ''));  
      raw = raw.substring(i + match[0].length);  
    }  
    addText(raw);  
    return html.join('');  
  
    function addText(text) {  
      if (!text) {  
        return;  
      }  
      html.push(text);  
    }  
  
    function addLink(url, text) {  
      html.push('<a ');  
      if (angular.isDefined(target)) {  
        html.push('target="');  
        html.push(target);  
        html.push('" ');  
      }  
      html.push('href="');  
      html.push(url);  
      html.push('">');  
      addText(text);  
      html.push('</a>');  
    }  
  };  
}); 

// This filter now requires linkyUnsanitized to remove requirement for ngSanitize
tweetApp.filter('tweetLinky',['$filter',
  function($filter) {
    return function(text, target) {
      if (!text) return text;

      var replacedText = $filter('linkyUnsanitized')(text, target);
      var targetAttr = "";
      if (angular.isDefined(target)) {
        targetAttr = ' target="' + target + '"';
      }
      var replacePattern1 = /(^|\s)#(\w*[a-zA-Z_]+\w*)/gim;
      replacedText = text.replace(replacePattern1, '$1<a href="https://twitter.com/hashtag/$2"' + targetAttr + '>#$2</a>');

      var replacePattern2 = /(^|\s)\@(\w*[0-9a-zA-Z_]+\w*)/gim;
      replacedText = replacedText.replace(replacePattern2, '$1<a href="https://twitter.com/$2"' + targetAttr + '>@$2</a>');

      return replacedText;
    };
  }   
]); 

// Cribbed from http://stackoverflow.com/a/18186947/5487137
// Don't see a better solution
tweetApp.filter('orderObjectBy', function(){
  return function(input, attribute) {
    if (!angular.isObject(input)) return input;

    var array = [];
    for(var objectKey in input) {
      array.push(input[objectKey]);
    }

    array.sort(function(a, b){
      a = parseInt(a[attribute]);
      b = parseInt(b[attribute]);
      return a - b;
    });
    return array;
  }
});

tweetApp.service('paramsParse', function() {
  return {
    object2mongo: function(object) {
      var errors = [];
      var mongoQuery = {};
      var queryTo = {};
      var queryFrom = {};
      
      object = _.extend({from: [], to: []}, object);
      
      if ((object.from.length==0) && (object.to.length==0)) {
        errors.push('one or more of "to" or "from" property required');
      } else {
      
        if (object.hasOwnProperty('to')) {
          // if object.to isn't valid, push error text
          if (Array.isArray(object.to) && (object.to.length>1)) {
            queryTo = {"entities.user_mentions":{"$elemMatch":{"id_str":{"$in":object.to}}}};
          } else if (Array.isArray(object.to)) {
            queryTo = {"entities.user_mentions":{"$elemMatch":{"id_str":object.to[0]}}};
          }
        }
        
        if (object.hasOwnProperty('from')) {
          // if object.from isn't valid, push error text
          if (Array.isArray(object.from) && (object.from.length>1)) {
            queryFrom = {"user.id_str":{"$in":object.from}};
          } else if (Array.isArray(object.from)) {
            queryFrom = {"user.id_str":object.from[0]};
          }
        }
                  
        if ((object.from.length>0) && (object.to.length==0)) {
          mongoQuery = queryFrom;
        } else if ((object.to.length>0) && (object.from.length==0)) {
          mongoQuery =  queryTo;
        } else {
          mongoQuery =  {"$or": [queryFrom, queryTo]};
        }
      }
      
      if (errors.length==0) {
        return mongoQuery;
      } else {
        return {errors: errors};
      }
    }, 
    mongo2object: function(mongo) {
      var to = [];
      var from = [];
      
      if (mongo.hasOwnProperty('$or')) {
        mongo = mongo['$or'];
        mongo = _.extend(mongo[0], mongo[1]);
      }
      
      if (mongo.hasOwnProperty('user.id_str')) {
        if (mongo['user.id_str'].hasOwnProperty('$in')) {
          from = _.compact(mongo['user.id_str']['$in']);
        } else if (_.isArray(mongo['user.id_str'])) {
          from = _.compact(_.pluck(mongo, 'user.id_str'));
        } else {
          from = mongo['user.id_str']
        }
      }
      
      if (mongo.hasOwnProperty('entities.user_mentions')) {
        if (mongo['entities.user_mentions'].$elemMatch.id_str.hasOwnProperty('$in')) {
          to = _.compact(mongo['entities.user_mentions'].$elemMatch.id_str.$in);
        } else {
          to = mongo['entities.user_mentions'].$elemMatch.id_str
        }
      }
      
      if (!_.isArray(to)) {
        to = [to];
      }
      
      if (!_.isArray(from)) {
        from = [from];
      }
      
      object = {to: to, from: from};
      return object;
    }
  }
});
