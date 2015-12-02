var express = require('express');
var app = express();
var server = require('http').createServer(app);
server.listen(3000);

var io = require('socket.io').listen(server);

var mongodb = require('mongodb');
mongodb.connect('mongodb://127.0.0.1:27017/tweets', function (err, db) {
  if (err) {
    throw err;
  } else {
    console.log('Connected to mongo');

    io.on('connect', function (socket) {
      // Upon connection to single client for first time await listen events
      console.log(socket.id + ' connected');
      
      // This tells us a brand new client has connected and needs initial Tweets load
      socket.on('initRequest', function(limit) {
        console.log(limit + ' tweets requested by client ' + socket.id);
        
        // Request 'limit' Tweets from mongodb
        db.collection('tweets').find().sort([['id_str', -1]]).limit(limit).each(function (err, tweet) {
          if (tweet !== null) {
            // emit each Tweet back to client that made request
            socket.emit('bottomTweet', tweet);
          }
        });

        console.log('Initial ' + limit + ' tweets sent to client ' + socket.id);
      });

      // This event is recieved from a client who lost connection and is reconnecting
      socket.on('updateRequest', function (lastTweet) {
        console.log('Up-to-date request recieved from client ' + socket.id + '. lastTweet: ' + lastTweet);
        db.collection('tweets').find({id_str: {$gt: lastTweet}}).each(function (err, tweet) {
          if (tweet !== null) {
            socket.emit('topTweet', tweet);
          }
        });
      });
      // This event is recieved when client goes to bottom of view and needs more tweets
      socket.on('NextTweets', function (tweetParams) {
        console.log('Next Tweets request recieved from client ' + socket.id + '. tweetParams: ' + tweetParams.last);

        db.collection('tweets').find({id_str: {$lt: tweetParams.last}}).sort([['id_str', -1]]).limit(tweetParams.count).each(function (err, tweet) {
          if (tweet !== null) {
            socket.emit('bottomTweet', tweet);
          } 
        }); 

      });
    });

    // Config file for private stuff
    var config = require('./config.js');
    
    var Twat = require('twat');

    // Connect to Twitter with Twat
    var twit = new Twat({
      consumer_key: config.consumer_key,
      consumer_secret: config.consumer_secret,
      access_token: config.access_token,
      access_token_secret: config.access_token_secret
    }); 
    
    var twitStreamParams = config.twitter;

    // Open new Twitter stream with Twat
    twit.stream('statuses/filter', twitStreamParams, function (stream) {
      stream.on('tweet', function (tweet) {
        console.log(tweet.retweeted_status + ' ' + tweet.id_str);
        if(tweet.retweeted_status) { 
          // console.log('Tweet ' + tweet.id_str + 'is just RT; ignored.');
        } else {
          tweet.created_at = new Date(tweet.created_at);
          io.sockets.emit('tweet', tweet);
          console.log('Tweet ' + tweet.id_str + ' created at ' + tweet.created_at);

          db.collection('tweets').insert(tweet, function (err, records) {
            if (err) throw err;
            console.log('tweet id ' + tweet.id_str + ' inserted to mongodb');
          });
        }
      });

      stream.on('error', function (type, info) {
        console.log('Twitter stream error: ' + info);
      });

      stream.on('end', function (response) {
        console.log('End request recieved from Twitter: ' + response);
      });

      stream.on('reconnect', function (info) {
        console.log('Reconnect error: ' + info.error);    // The error causing reconnection
        console.log('Reconnect attempt(s): ' + info.attempts); // Number of reconnects attempted
      });
    });
  }
});

app.use(express.static(__dirname + '/public'));
