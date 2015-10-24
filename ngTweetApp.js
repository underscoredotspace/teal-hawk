var tweetApp = angular.module('tweetApp', []);
tweetApp.controller('TweetCtrl', function ($scope, $http, $interval){
  $scope.tt_query = "";

  $http.get('json.php').success(function(data) {
    $scope.tweets = data;
  });

  $scope.$watch('tt_query', function(){
    $http.get('json.php?tt='+ $scope.tt_query).success(function(data) {
      $scope.tweets = data;
    });
  });

  $scope.tt_submit = function() {
    $scope.tt_query=$scope.tt_query_input;
  };

  $scope.Timer = $interval(function () {
    $http.get('json.php?tt='+ $scope.tt_query).success(function(data) {
      $scope.tweets = data;
    });
  }, 10000);
});

// html filter (render text as html)
tweetApp.filter('html', ['$sce', function ($sce) { 
  return function (text) {
    return $sce.trustAsHtml(text);
  };  
}])
