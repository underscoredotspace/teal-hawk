var tweetApp = angular.module('tweetApp', ['angularMoment', 'ngAnimate', 'ngTouch', 'ngRoute']);

tweetApp.config(function($routeProvider) {
  $routeProvider
  .when('/', {
    templateUrl: 'tweets/tweet-deck.html',
    controller: 'tweetDeck'
  });
});

tweetApp.factory('socket', function(){
  var socket = io.connect();
  return socket;
});

tweetApp.directive('menuBar', function(){
  return {
    restrict: 'E', 
    templateUrl: '/menu-bar',
    replace: true
  }
});

tweetApp.directive('goThere', function($window){
  return {
    restrict: 'A', 
    link: function($scope, $element, $attrs) {
      $element.bind('click', function () {
        $scope.$apply(function () {
          $window.location.href = $attrs.goThere;
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
