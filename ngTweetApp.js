var tweetApp = angular.module('tweetApp', []);
tweetApp.controller('TweetCtrl', function ($scope, $http, $interval){
  $http.get('json.php').success(function(data) {
    $scope.tweets = data;
  });

  $scope.Timer = $interval(function () {
     $http.get('json.php?created_at=' + $scope.tweets[0].created_at).success(function(data) {
      if(data.length>0){
        for (var i=0; i<data.length; i++){
          $scope.tweets.unshift(data[i]);
         }
      }
    });
  }, 10000);
});

// html filter (render text as html)
tweetApp.filter('html', ['$sce', function ($sce) { 
  return function (text) {
    return $sce.trustAsHtml(text);
  };  
}])

tweetApp.filter('proxy_image', function() {
  return function(text) {
    var out = "";
    if (text.search("http://abs.twimg.com") >-1) {
      out = "img.php?url=" + text; 
    } else {
      out = text.replace("http://pbs.twimg.com/profile_images/", "img.php?url=");
    }
    return out;
  };
})
