// Set up of tweetApp module. 
//   Moment used for nice time presentation
//   Animate for visual introduction of new data to view

var tweetApp = angular.module('tweetApp', ['angularMoment', 'ngAnimate']);

tweetApp.controller('tweetController', function ($scope, $filter, socket){
  socket.on('connect', function(){
    console.log('connected');
  });

  socket.on('connect_error', function(err){
    console.log('connection error: ' + err);
  });
  
  $scope.columns = [{
    "id": "fdac",
    "position": 2,
    "type": "tweetColumn",
    "parameters": '{\"$or\":[{\"user.id_str\":\"284537825\"},{\"entities.user_mentions.id_str\":\"284537825\"}]}'
  },{
    "id": "e0b1",
    "position": 1,
    "type": "tweetColumn",
    "parameters": '{\"$or\":[{\"user.id_str\":\"284540385\"},{\"entities.user_mentions.id_str\":\"284540385\"}]}'
  }];
  
  $scope.criteria = [];
  for (var count = 0; count <= $scope.columns.length-1; count++) {
    oColumns = JSON.parse($scope.columns[count].parameters);
    $scope.criteria[$scope.columns[count].id] = {};

    if (oColumns.hasOwnProperty("$or")) {
      for (var criterion in oColumns["$or"]) {
        key = Object.keys(oColumns["$or"][criterion])[0];
        value = oColumns["$or"][criterion][key];
        $scope.criteria[$scope.columns[count].id][key] = value;
      }
    }    
  }
});