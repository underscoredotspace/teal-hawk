var tweetApp = angular.module('tweetApp', []);
tweetApp.controller('TweetCtrl', function ($scope, $http){
  $http.get('json.php').success(function(data) {
    $scope.tweets = data;
  });
});

// html filter (render text as html)
tweetApp.filter('html', ['$sce', function ($sce) { 
  return function (text) {
    return $sce.trustAsHtml(text);
  };  
}])
