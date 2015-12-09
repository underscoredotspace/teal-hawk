tweetApp.factory('socket', function(){
  var socket = io.connect();
  return socket;
});
