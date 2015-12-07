tweetApp.factory('socket', function(){
  if (location.port != '') {
    var socket = io.connect('http://' + location.hostname + ':' + location.port);
  } else {
    var socket = io.connect('http://' + location.hostname + ':80');
  }    
  console.log(location);
  return socket;
});
