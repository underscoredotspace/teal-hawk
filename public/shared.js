var tweetApp = angular.module('tweetApp', ['angularMoment', 'ngAnimate']).constant('_', window._);

tweetApp.factory('socket', function(){
  var socket = io.connect();
  return socket;
});

tweetApp.directive('button', function($timeout) {
  return {
    restrict: 'E',
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
