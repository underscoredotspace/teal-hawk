var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
server.listen(3000);
var extend = require('util')._extend;
var mongodb = require('mongodb').MongoClient;
var tweetsDB = 'mongodb://127.0.0.1:27017/tweets'

mongodb.connect(tweetsDB, function (err, db) {
  if (err) {
    console.error('Can\'t connect to mongodb. Exiting. ');
    process.exit(1);
  } else {
    console.log('Connected to mongo');

    io.sockets.on('connection', function (socket) {
      // Upon connection to single client for first time await listen events
      console.log(socket.id + ' connected');
      
      socket.on('disconnect', function() {
        console.log(socket.id + ' disconnected');
      }); 
      
//      socket.on('logon', function(username){
//        console.log(Date() + ': ' + username + ' logged on, requires column data');
//        db.collection('users').find({username: username}, {columns: 1, _id: 0}).toArray(function(err, columns) {
//          
//        });
//      });
      
      // This tells us the new client needs initial Tweets
      socket.on('initRequest', function(initRequest) {
        // #TODO# - validate initRequest
        console.log(Date() + ': initRequest from ' + socket.id + ' for ' + initRequest.tweetColumn);
        
        // Get column's search parameters from mongodb
        db.collection('columns').find({'id': initRequest.tweetColumn},{'parameters':1,"_id":0}).limit(1).toArray(function(err, column) {
          // Request 'limit' Tweets from mongodb
          // #TODO# - make sure we got valid data to column[0]
          db.collection('tweets').find(JSON.parse(column[0].parameters)).sort([['id_str', -1]]).limit(initRequest.tweetCount).toArray(function (err, tweet) {
            if (tweet !== null) {
              // emit Tweets back to client/column that made request
              socket.emit('bottomTweet', [initRequest.tweetColumn, tweet]);
            }
          }); 
        });
        
        console.log(Date() + ': initRequest to ' + socket.id + ' for ' + initRequest.tweetColumn);
      }); // End of initRequest event

      // This event is recieved from a client who lost connection and is reconnecting
      socket.on('updateRequest', function (updateRequest) {
        // #TODO# - validate updateRequest
        console.log(Date() + ': ' + socket.id + ' reconnected.');
        // Get column's search parameters from mongodb
        db.collection('columns').find({'id': updateRequest.tweetColumn},{'parameters':1,"_id":0}).limit(1).toArray(function(err, column) {
          var query = extend({id_str: {$gt: updateRequest.lastTweet}}, JSON.parse(column[0].parameters));
          db.collection('tweets').find(query).toArray(function (err, tweet) {
            if ((tweet !== null) && (tweet.length>0)) {
              socket.emit('topTweet', [updateRequest.tweetColumn, tweet]);
              console.log(Date() + ': ' + tweet.length + ' tweets sent to ' + socket.id + ' for column ' + updateRequest.tweetColumn);
            } else {
              console.log('No new tweets since ' + updateRequest.lastTweet + ' to send for column ' + updateRequest.tweetColumn);
            }
          });
        });
      }); // End of updateRequest event
      
      // This event is recieved when client goes to bottom of view and needs more tweets
      socket.on('NextTweets', function (nextTweets) {
        // #TODO# - validate nextTweets
        console.log(Date() + ': nextTweets from ' + socket.id + ' for ' + nextTweets.tweetColumn + ' after ' + nextTweets.lastTweet);
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
    }); // End of NextTweets event
    
    // Config file for private Twitter keys etc.
    var config = require('./config.js');
    var Twitter = require('twit');

    var twit = new Twitter({
      consumer_key: config.consumer_key,
      consumer_secret: config.consumer_secret,
      access_token: config.access_token,
      access_token_secret: config.access_token_secret
    });
    
    var twitStreamParams = config.twitter;
    
    // Open new Twitter stream with Twat
    var stream = twit.stream('statuses/filter', twitStreamParams);
    //twit.stream('statuses/sample', function (stream) {
    stream.on('connect', function() {
      console.log(Date() + ': connected to Twitter');
    });
    
    stream.on('tweet', function (tweet) {
      tweet.created_at = new Date(tweet.created_at);
      var tweetOut = [tweet];
      io.sockets.emit('topTweet', ['*', tweetOut]);
      console.log(tweet.created_at + ' new tweet ' + tweet.id_str);

      db.collection('tweets').insert(tweet, function (err, records) {
        if (err) {
          console.log('Database error: ' + err)
        } else {
          console.log('tweet id ' + tweet.id_str + ' inserted to mongodb');
        }
      });
    });
      
    stream.on('delete', function (deleteData) {
      db.collection('tweets').deleteOne({id_str:deleteData.delete.status.id_str}, function(err, records){
        if (err) throw err; 
        console.log(Date() + ': tweet ' + deleteData.delete.status.id_str + ' deleted');
        io.sockets.emit('deleteTweet', deleteData.delete.status.id_str);
      });
    });
    
    // bit of debugging here, needs to be handled rather than just spat out
    stream.on('limit', function (limitMessage) {
      console.log(Date() + ': ' + {limit: limitMessage});
    });

    stream.on('reconnect', function (request, response, connectInterval) {
      console.log(Date() + ': reconnect: ' + connectInterval);
    })

    stream.on('error', function(error) {
      console.error(Date() + ': ' + {error: error});
    });

    stream.on('warning', function(msg) {
      console.error({warning: msg});
    });
    
  }
});