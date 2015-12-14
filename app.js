var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));

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
      socket.on('initRequest', function(reqParams) {
        limit = reqParams[1];
        tweetColumn = reqParams[0];
        console.log(limit + ' tweets requested by client ' + socket.id);
        
        // Request 'limit' Tweets from mongodb
        db.collection('tweets').find().sort([['id_str', -1]]).limit(limit).each(function (err, tweet) {
          if (tweet !== null) {
            // emit each Tweet back to client that made request
            socket.emit('bottomTweet', [tweetColumn, tweet]);
          }
        });

        console.log('Initial ' + limit + ' tweets sent to client ' + socket.id);
      });

      // This event is recieved from a client who lost connection and is reconnecting
      socket.on('updateRequest', function (reqParams) {
        lastTweet = reqParams[1];
        tweetColumn = reqParams[0];
        console.log('Up-to-date request recieved from client ' + socket.id + '. lastTweet: ' + lastTweet);
        db.collection('tweets').find({id_str: {$gt: lastTweet}}).each(function (err, tweet) {
          if (tweet !== null) {
            socket.emit('topTweet', [tweetColumn, tweet]);
          }
        });
      });
      
      // This event is recieved when client goes to bottom of view and needs more tweets
      socket.on('NextTweets', function (reqParams) {
        tweetParams = reqParams[1];
        tweetColumn = reqParams[0];
        console.log('Next Tweets request recieved from client ' + socket.id + '. tweetParams: ' + tweetParams.last);

        db.collection('tweets').find({id_str: {$lt: tweetParams.last}}).sort([['id_str', -1]]).limit(tweetParams.count).each(function (err, tweet) {
          if (tweet !== null) {
            socket.emit('bottomTweet', [tweetColumn, tweet]);
          } 
        }); 

      });
    });
    
    // Config file for private stuff
    var config = require('./config.js');
    
    var Twitter = require('twitter');

    var twit = new Twitter({
      consumer_key: config.consumer_key,
      consumer_secret: config.consumer_secret,
      access_token_key: config.access_token,
      access_token_secret: config.access_token_secret
    });
    
    var twitStreamParams = config.twitter;
    
    // Open new Twitter stream with Twat
    twit.stream('statuses/filter', twitStreamParams, function (stream) {
    //twit.stream('statuses/sample', function (stream) {
      stream.on('data', function (tweet) {
        if((tweet.text) && (!tweet.retweeted_status)) {
            tweet.created_at = new Date(tweet.created_at);
            io.sockets.emit('topTweet', ['*', tweet]);
            console.log('Tweet ' + tweet.id_str + ' created at ' + tweet.created_at);

            db.collection('tweets').insert(tweet, function (err, records) {
              if (err) throw err;
              console.log('tweet id ' + tweet.id_str + ' inserted to mongodb');
            });
        } else if (tweet.delete) {
          db.collection('tweets').deleteOne({id_str:tweet.delete.status.id_str}, function(err, records){
            console.log('Tweet ' + tweet.delete.status.id_str + ' deleted from db')
          });
          // delete tweet from database
          // broadcast to all clients that they shoudl also delete
        }
      });

      stream.on('error', function(error) {
        console.log(error);
      });
    });
  }
});