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
});