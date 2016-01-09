// Set up of tweetApp module. 
//   Moment used for nice time presentation
//   Animate for visual introduction of new data to view

var tweetApp = angular.module('tweetApp', ['angularMoment', 'ngAnimate', 'ngTouch']);

tweetApp.controller('tweetController', function ($scope, $filter, socket){
  socket.on('connect', function(){
    console.log('connected');
  });

  socket.on('connect_error', function(err){
    console.log('connection error: ' + err);
  });
  
  $scope.columns = [{
    "id": "fdac",
    "position": 1,
    "type": "tweetColumn",
    "parameters": '{\"$or\":[{\"user.id_str\":\"284537825\"},{\"entities.user_mentions.id_str\":\"284537825\"}]}'
  },{
    "id": "e0b1",
    "position": 2,
    "type": "tweetColumn",
    "parameters": '{\"$or\":[{\"user.id_str\":\"284540385\"},{\"entities.user_mentions.id_str\":\"284540385\"}]}'
  }];
  
  $scope[$scope.columns[0].id] = true;
  
  $scope.next = function(colID) {
    currentColID = colID;
    colID++;
    if (colID>$scope.columns.length-1) {
      colID = 0;
    }
    // Add slide LEFT animation class
    // @TODO
    
    // Trigger actual ng-show stuff
    $scope[$scope.columns[currentColID].id]=false;
    $scope[$scope.columns[colID].id]=true;
    
    // Remove slide LEFT animation class
    // @TODO
  }
  
  $scope.prev = function(colID) {
    currentColID = colID;
    colID--;
    if (colID<0) {
      colID = $scope.columns.length-1;
    }
    // Add slide RIGHT animation class
    // @TODO
    
    // Trigger actual ng-show stuff
    $scope[$scope.columns[currentColID].id]=false;
    $scope[$scope.columns[colID].id]=true;
    
    // Remove slide RIGHT animation class
    // @TODO
  }
  
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