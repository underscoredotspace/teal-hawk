/* global __dirname */
var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
server.listen(3000);

var extend = require('util')._extend;

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
      socket.on('initRequest', function(initRequest) {
        console.log('Initial ' + initRequest.tweetCount + ' tweets requested by client ' + socket.id + ' for column ' + initRequest.tweetColumn);
        
        // Get column's search parameters from mongodb
        db.collection('columns').find({'id': initRequest.tweetColumn},{'parameters':1,"_id":0}).limit(1).toArray(function(err, column) {
          // Request 'limit' Tweets from mongodb
          db.collection('tweets').find(JSON.parse(column[0].parameters)).sort([['id_str', -1]]).limit(initRequest.tweetCount).toArray(function (err, tweet) {
            if (tweet !== null) {
              // emit Tweets back to client/column that made request
              socket.emit('bottomTweet', [initRequest.tweetColumn, tweet]);
            }
          }); 
        });
        
        console.log('Initial ' + initRequest.tweetCount + ' tweets sent to client ' + socket.id + ' for column ' + initRequest.tweetColumn);
      });

      // This event is recieved from a client who lost connection and is reconnecting
      socket.on('updateRequest', function (updateRequest) {
        console.log('Up-to-date request recieved from client ' + socket.id + '. lastTweet: ' + updateRequest.lastTweet);
        // Get column's search parameters from mongodb
        db.collection('columns').find({'id': updateRequest.tweetColumn},{'parameters':1,"_id":0}).limit(1).toArray(function(err, column) {
          var query = extend({id_str: {$gt: updateRequest.lastTweet}}, JSON.parse(column[0].parameters));
          db.collection('tweets').find(query).toArray(function (err, tweet) {
            if ((tweet !== null) && (tweet.length>0)) {
              socket.emit('topTweet', [updateRequest.tweetColumn, tweet]);
              console.log(tweet.length + ' new tweets sent for column ' + updateRequest.tweetColumn);
            } else {
              console.log('No new tweets since ' + updateRequest.lastTweet + ' to send for column ' + updateRequest.tweetColumn);
            }
          });
        });
      });
      
      // This event is recieved when client goes to bottom of view and needs more tweets
      socket.on('NextTweets', function (nextTweets) {
        console.log('Next ' + nextTweets.tweetCount + ' Tweets after ' + nextTweets.lastTweet + ' requested by client ' +     socket.id + ' for column ' + nextTweets.tweetColumn);
        var query = {id: nextTweets.tweetColumn};
        var restrict = {parameters:1,_id:0};
        db.collection('columns').find(query,restrict).limit(1).toArray(function(err, column) {
          // Request 'limit' Tweets from mongodb
          var query = extend({id_str: {$lt: nextTweets.lastTweet}}, JSON.parse(column[0].parameters));
          db.collection('tweets').find(query).sort([['id_str', -1]]).limit(nextTweets.tweetCount).toArray(function (err, tweet) {
            if (tweet !== null) {
              socket.emit('bottomTweet', [nextTweets.tweetColumn, tweet]);
            } 
          }); 
        });
      });
    });
    
    // Config file for private Twitter keys etc.
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
      console.log('Connected to Twitter');
      stream.on('data', function (tweet) {
        if((tweet.text) && (!tweet.retweeted_status)) {
            tweet.created_at = new Date(tweet.created_at);
            var tweetOut = [tweet];
            io.sockets.emit('topTweet', ['*', tweetOut]);
            console.log('Tweet ' + tweet.id_str + ' created at ' + tweet.created_at);

            db.collection('tweets').insert(tweet, function (err, records) {
              if (err) throw err;
              console.log('tweet id ' + tweet.id_str + ' inserted to mongodb');
            });
        } else if (tweet.delete) {
          db.collection('tweets').deleteOne({id_str:tweet.delete.status.id_str}, function(err, records){
            if (err) throw err; 
            console.log('Tweet ' + tweet.delete.status.id_str + ' deleted from db');
            io.sockets.emit('deleteTweet', tweet.delete.status.id_str);
          });
        }
      });

//      stream.on('error', function(error) {
//        throw error;
//      });
    });
  }
});