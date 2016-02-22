tweetApp.controller('configController', function ($scope) {
  $scope.follows = [];
  $scope.tracks = [];
  
  $scope.addfollow = function() {
    $scope.follows.push({search:''});
  };
  $scope.addtrack = function() {
    $scope.tracks.push({search:''});
  };
  
  $scope.removefollow = function(index) {
    $scope.follows.splice(index,1);
  };
  $scope.removetrack = function(index) {
    $scope.tracks.splice(index,1);
  };
  
  $scope.showinputdata = function () {
    var raw = {from: [], to: []};
    
    if ($scope.follows.length == 1) {
      raw.to = $scope.follows[0].search;
    } else if ($scope.follows.length >1) {
      angular.forEach($scope.follows, function (follow){
        raw.to.push(follow.search);
      });
    }
    
    if ($scope.tracks.length == 1) {
      raw.from = $scope.tracks[0].search;
    } else if ($scope.tracks.length >1) {
      angular.forEach($scope.tracks, function (track){
        raw.from.push(track.search);
      });
    }
    
    console.log(object2mongo(raw));
  }
  
  function object2mongo (raw) {
    var errors = [];
    var fail = false;
    var mongoQuery = {};
    var queryTo = {};
    var queryFrom = {};
    
    if ((raw.from.length==0) && (raw.to.length==0)) {
      fail = true;
      errors.push('one or more of "to" or "from" property required');
    } else {
    
      if (raw.hasOwnProperty('to')) {
        // if raw.to isn't valid, push error text and fail=true
        if (raw.to.length == 1) {
          queryTo = {"entities.user_mentions":{"$elemMatch":{"id_str":raw.to[0]}}};
        } else if ((raw.to.length > 1)) { // if $scope.to.length > 1;
          queryTo = {"entities.user_mentions":{"$elemMatch":{"id_str":{"$in":raw.to}}}};
        }
      }
      if (raw.hasOwnProperty('from')) {
        // if raw.from isn't valid, push error text and fail=true
        if (typeof(raw.from) == 'string') {
          queryFrom = {"user.id_str":raw.from};
        } else if ((raw.from.length > 1) && (raw.from.length!=0)) { // if $scope.to.length > 1;
          queryFrom = {"user.id_str":{"$in":raw.from}};
        }
      }
      
      if ((raw.to.length==0) && (raw.from.length>0)){
        mongoQuery = queryFrom;
      } else if((raw.to.length>0) && (raw.from.length==0)) {
        mongoQuery =  queryTo;
      } else {
        mongoQuery =  {"$or": [queryFrom, queryTo]};
      }
    }
    if (fail == false) {
      return {mongoQuery: mongoQuery};
    } else {
      return {errors: errors};
    }
  }
});