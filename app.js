var express = require('express');
var app = express();
var mongodb = require('mongodb');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var Twat = require('twat');

server.listen(3000);

mongodb.connect('mongodb://127.0.0.1:27017/tweets', function(err, db) {
  if (err) throw err;
  console.log("Connected to mongo");

  io.on('connect', function(socket) {
    console.log(socket.id + ' connected');
    socket.on('initRequest', function(limit) {
      console.log(limit + ' tweets requested by client ' + socket.id);
      db.collection('tweets').find().sort([['id', -1]]).limit(limit).each(function(err, tweet) {
        if (tweet!=null) {
          socket.emit('tweetinit', tweet);
        }
      }); 
      
      console.log('Initial ' + limit + ' tweets sent to client ' + socket.id);
    });

    socket.on('updateRequest', function(lastTweet) {
      console.log('update requested after connection break. lastTweet: ' + lastTweet);
    });

  });

  twit.stream('statuses/filter', {'track': 'NatWest_Help, RBS_Help', 'follow': '284540385, 284537825'}, function(stream) {
    stream.on('tweet', function(tweet) {
      console.log(tweet.retweeted_status + ' ' + tweet.id);
      if(tweet.retweeted_status) { 
        console.log('Tweet ' + tweet.id + 'is just RT; ignored.');
      } else {
        tweet.created_at = new Date(tweet.created_at);
        io.sockets.emit('tweet', tweet);
        console.log('Tweet ' + tweet.id + ' created at ' + tweet.created_at);

        db.collection('tweets').insert(tweet, function(err, records) {
          if (err) throw err;
          console.log('tweet id ' + tweet.id + ' inserted to mongodb');
        });
      }
    });

    stream.on('error', function(type, info) {
      console.log('Error: ' + type + " " + info);
    });

    stream.on('end', function(response) {
      console.log(response);
    });

    stream.on('reconnect', function(info) {
      console.log('Reconnect error: ' + info.error);    // The error causing reconnection
      console.log('Reconnect attempt(s): ' + info.attempts); // Number of reconnects attempted
    });
  });
});

var config = require('./config.js');

var twit = new Twat({
  consumer_key: config.consumer_key,
  consumer_secret: config.consumer_secret,
  access_token: config.access_token,
  access_token_secret: config.access_token_secret
}); 

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/bower_components'));
