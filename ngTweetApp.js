var tweetApp = angular.module('tweetApp', ['angularMoment', 'ngAnimate']);
tweetApp.controller('TweetCtrl', function ($scope, $http, $interval, $timeout){
  $http.get('json.php?count=100').success(function(data) {
    $scope.tweets = data;
  });

  $scope.Timer = $interval(function () {
     $http.get('json.php?tweet_id_after=' + $scope.tweets[0].tweet_id).success(function(data) {
      if(data.length>0){
        console.log(data.length + ' new tweets');
        for (var i=data.length-1; i>=0; i--){
          $scope.tweets.unshift(data[i]);
        }
      } // else {console.log("No new tweets");}
    });
  }, 5000);
});

// Tells view to accept tweet_text as html. 
tweetApp.filter('html', ['$sce', function ($sce) { 
  return function (text) {
    return $sce.trustAsHtml(text);
  };  
}])

// Linkify t.co links #tags and @mentions
tweetApp.filter('linkify', ['$sce', function ($sce) { 
  return function (text) {
    // t.co links
    text = text.replace(/(https\:\/\/t\.co\/[a-zA-Z0-9]+)/g, '<a href="$1">$1</a>');
    // @mentions
    text = text.replace(/@(\w+)/g, '<a href="/?q=$1">@$1</a>');

    // #tags
    text = text.replace(/#(\w+)/g, '<a href="/?q=%23$1">#$1</a>');

    return text;
  };  
}])


// Proxies profile images, but should be able to handle any image with little work. 
tweetApp.filter('proxy_image', function() {
  return function(text) {
    var out = "";
    // to catch new egg profile pics
    if (text.search("http://abs.twimg.com") >-1) {
      out = "img.php?url=" + text; 
    } else {
      // to catch normal profile images
      out = text.replace("http://pbs.twimg.com/profile_images/", "img.php?url=");
    }
    return out;
  };
})
