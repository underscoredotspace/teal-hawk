var tweetApp = angular.module('tweetApp', ['angularMoment']);
tweetApp.controller('TweetCtrl', function ($scope, $http, $interval, $timeout){
  $http.get('json.php?count=10').success(function(data) {
    $scope.tweets = data;
    $timeout(function() {
      $http.get('json.php?count=90&created_before=' + $scope.tweets[$scope.tweets.length-1].tweet_id).success(function(data) {
        if(data.length>0) {
          for (var i=0; i<data.length; i++) {
            $scope.tweets.push(data[i]);
            $scope.tweets.order = $scope.tweets.tweet_id; // #Hack due to tweets being parsed into db in wrong order 
          }
        }
      });
    },0);
  });

  $scope.Timer = $interval(function () {
     $http.get('json.php?created_after=' + $scope.tweets[0].tweet_id).success(function(data) {
      if(data.length>0){
        for (var i=0; i<data.length; i++){
          $scope.tweets.unshift(data[i]);
          $scope.tweets.order = $scope.tweets.tweet_id; // #Hack due to tweets being parsed into db in wrong order
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

//function replaceAll(find, replace, str) {
//  return str.replace(new RegExp(find, 'g'), replace);
//}

tweetApp.filter('time_ago', function() {
  return function(timeIn) {
    return relativetime(timeIn);
  };
})    

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
