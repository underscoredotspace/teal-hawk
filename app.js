// Connect to database
// Connect to Twitter
// Set up socketio
// Set up passport
// Set up Express routes
// Start http server


"use strict";
var mongodb = require('mongodb').MongoClient;
var db = require('./server/db');
var tweetsDB = 'mongodb://127.0.0.1:27017/tweets'
var connectMongo = require('connect-mongo');
var config = require('./config.js');
var Twitter = require('twit');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var ejs = require('ejs');
var passport = require('passport');
var passportSocketIo = require("passport.socketio");
var http = require("http");
var socketio = require('socket.io');
var app = express();
var server = http.createServer(app);
var io = socketio.listen(server);
var MongoStore = connectMongo(session);
var connectEnsureLogin = require('connect-ensure-login');

// CONNECT TO MONGO
db.connect('mongodb://127.0.0.1:27017/tweets', function(err) {
  if (err) {
    console.error(err);
    process.exit(1)
    } else {

  // Passport and Passport.SocketIO setup
  var sessionStore = new MongoStore({url: tweetsDB});
  var Strategy = require('passport-twitter').Strategy;
  passport.use(new Strategy({
      consumerKey: config.twitter.consumer_key,
      consumerSecret: config.twitter.consumer_secret,
      callbackURL: config.twitter.callbackURL
    },
    function(token, tokenSecret, profile, cb) {
      db.collection('users').find({'twitter_id': profile.id}).limit(1).toArray(function(err, user){        
        if (user.length>0) {
          var registered=user[0].registered;
          var admin=user[0].admin;
          // update profile in mongo? 
        } else{
          var registered=false;
          var admin=false;
          db.collection("users").insert({name: profile.username, twitter_id: profile.id, tRAW: profile, registered: false, admin: false, columns: []});
        }
        return cb(null, {user_id: profile.id, user_name: profile.username, user_image: profile.photos[0].value, registered: registered, admin: admin});
      })
    }
  ));

  passport.serializeUser(function(user, cb) {
    cb(null, user);
  });

  passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
  });

  io.use(passportSocketIo.authorize({
    cookieParser: cookieParser,
    key:          config.passport.key,
    secret:       config.passport.secret,
    store:        sessionStore,
    success:      onAuthorizeSuccess,
    fail:         onAuthorizeFail
  }));

  function onAuthorizeSuccess(data, accept){
    accept();
  }

  function onAuthorizeFail(data, message, error, accept){
    accept(new Error(message));
  }

  // Connect Twitter stream, and fire listen for socketio request
  // Express setup
  app.set('json spaces', 2)
  // Setup for dealing with POST data
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.set('views', __dirname + '/public/ejs_views');
  app.use('/bower_components',  express.static(__dirname + '/bower_components'));
  app.set('view engine', 'ejs');
  app.use(session({
    key: config.passport.key, 
    secret: config.passport.secret, 
    store: sessionStore, 
    saveUninitialized: false, 
    resave: false, 
    cookie: { secure: 'auto' }
  }));
  app.use(cookieParser());
  app.use(passport.initialize());
  app.use(passport.session());

  // Express routes
  app.get('/favicon.ico', function(req, res) {
    res.sendFile(__dirname + '/public/favicon.ico');
  })

  app.get('/login/twitter',
    passport.authenticate('twitter'));

  app.get('/login/twitter/callback',
    passport.authenticate('twitter', { failureRedirect: '/login'}),
    function(req, res) {    
      if (req.user.registered==true) {
        res.redirect('/');
      } else {
        res.redirect('/register');
      } 
    });

  app.get('/login',function(req,res) {
    if (req.user) {
      if (req.user.registered==true) {
        res.redirect('/');
      } else {
        res.redirect('/register');
      }
    } else {
      res.sendFile(__dirname + '/public/login.html');
    }
  });

  app.get('/login-style.css',function(req,res) {
      res.sendFile(__dirname + '/public/login-style.css');
  });

  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/login');
  });

  app.get('/register', function(req, res) {
    if(req.user) {
      if (req.user.registered==false) {
        res.render('register');
      } else {
        res.redirect('/');
      }
    } else {
      res.redirect('/login');
    }
  });

  app.get('/registered', function(req, res) {
    if (req.user) {
      db.collection('users').find({twitter_id: req.user.user_id}, {registered:1, _id: 0}).limit(1).toArray(function(err, user) {
        if (user[0].registered) {
          req.user.registered = true;
          req.session.save();
        }
        res.json(user[0]);
      });
    } else {
      res.sendStatus(401);
    }
  });

  app.get('/menu-bar', function(req, res) {
    if (req.user) {
      res.render('menu-bar', { user: req.user });
    } else {
      res.sendStatus(401);
    }
  });

  app.use('/api', require('./server/api'));

  var checkAdmin = function(req, res, next) {
    // check for registered
    if (req.hasOwnProperty('user')) {
      if (req.user.admin==true) {
        next();
      } else {
        res.sendStatus(401);
      }
    } else {
      res.sendStatus(401);
    }
  }

  app.get('/admin/api/:func/:param', checkAdmin, function(req, res) {
    // Returns specific user info
    if (req.params.func=='user') {
      // Returns details of users awaiting authorisation
      if (req.params.param=='waitingauth') {
        db.collection('users').find({registered:false}, {_id:false}).toArray(function(err, users) {
          res.json({users: users});
        });
      } else {
        res.sendStatus(404);
      }
    }

    // Deletes active user and logs them out
    if (req.params.func=='del') {
      // Delete user's sessions
      var userRegex = new RegExp('\"user_id\":\"' + req.params.param + '\"');
      db.collection('sessions').remove({session: {$regex: userRegex}}, {_id: false, session: true}, function(err, result) {
        if(err) {

        } else {
          console.log({sessions: result.result.n});
        }
      }); 

      // Delete user record
      db.collection('users').remove({ "twitter_id" : req.params.param}, function (err, result) {
        if(err) {
          
        } else {
          console.log({users: result.result.n});
        }
      }); 

      // Tell client to log user out and disconnect their socket
      var userSockets = passportSocketIo.filterSocketsByUser(io, function(user){
        return user.user_id == req.params.param;
      });
      userSockets.forEach(function(socket) {
        socket.emit('logout', 'Your account has been deleted\nYou will now be logged out');
        socket.disconnect();
      });
      console.log({sockets: userSockets.length});

      res.json({success: true}); // really want more verbose response than this
    }

    // Authorise new user waiting for access
    if (req.params.func=='auth') {
      db.collection('users').update({ "twitter_id" : req.params.param}, {$set: {registered: true}}, function(err, result) {
        if (err) {
          res.json({error: err});
        } else {
          res.json({result: result});
        }
      });
    }
  });

  app.get('/admin/api/*', checkAdmin, function(req, res) {
    res.sendStatus(400);
  })

  app.get('/admin/*', checkAdmin, function(req, res){
    res.sendFile(__dirname + '/public' + req.url);
  });

  app.get('*', connectEnsureLogin.ensureLoggedIn('/login'), function(req, res){
    // check for registered
    if (req.user.registered==true) {
      res.sendFile(__dirname + '/public' + req.url);
    } else {
      res.redirect('/login');
    }
  });

  io.sockets.on('connection', function (socket) {
    // Even though client has made connection (since they are logged in to Twitter), it doens't mean they are registered
    if (socket.request.user.registered==true) {
      // Upon connection to single client for first time await listen events
      console.log(Date() + ': ' + socket.id + ' connected');
      
      socket.on('disconnect', function() {
        console.log(Date() + ': ' + socket.id + ' disconnected');
      }); 

      socket.on('newColumn', function(newColumn){
        // #TODO# - validate newColumn)
        db.collection("users").update({twitter_id: socket.request.user.user_id}, {$push: {columns: newColumn}});
        socket.emit('columnAdded', newColumn.id);
      });
      
      socket.on('delColumn', function(columnID){
        db.collection("users").update({twitter_id: socket.request.user.user_id}, {$pull: {columns: {id: columnID}}});
      })
      
      // Hacky, but edit column by deleting by ID then adding in with same ID
      socket.on('editColumn', function (column) {
        db.collection("users").update({twitter_id: socket.request.user.user_id}, {$pull: {columns: {id: column.id}}});
        db.collection("users").update({twitter_id: socket.request.user.user_id}, {$push: {columns: column}});
      })

      // This event is recieved from a client who lost connection and is reconnecting
      socket.on('updateRequest', function (updateRequest) {
        // #TODO# - validate updateRequest
        console.log(Date() + ': ' + socket.id + ' reconnected.');
        if (updateRequest.hasOwnProperty('parameters')) {
          var searchQuery = {'$and': [JSON.parse(updateRequest.parameters), {'retweeted_status':{'$exists':false}}, {id_str: {$gt: updateRequest.lastTweet}}]};
          db.collection('tweets').find(searchQuery).toArray(function (err, tweet) {
            if ((tweet !== null) && (tweet.length>0)) {
              socket.emit('topTweet', [updateRequest.id, tweet]);
              console.log(Date() + ': ' + tweet.length + ' tweets sent to ' + socket.id + ' for column ' + updateRequest.id);
            } else {
              // console.log('No new tweets since ' + updateRequest.lastTweet + ' to send for column ' + updateRequest.id);
            }
          });
        }
      }); // End of updateRequest event
      
      // This event is recieved when client goes to bottom of view and needs more tweets
      socket.on('NextTweets', function (nextTweets) {
        var searchQuery = {'$and': [JSON.parse(nextTweets.parameters), {'retweeted_status':{'$exists':false}}, {id_str: {$lt: nextTweets.lastTweet}}]};
        db.collection('tweets').find(searchQuery).sort([['id_str', -1]]).limit(nextTweets.tweetCount).toArray(function (err, tweets) {
          if (tweets !== null) {
            // emit Tweets back to client/column that made request
            socket.emit('bottomTweet', [nextTweets.id, tweets]);
          }
        }); 
      }); // End of NextTweets event
    } else {
      console.log('unregistered user attempting to connect to WebSocket');
    }
  }); //End of io.sockets.on('connection')
        
  
  var twit = new Twitter({
    consumer_key: config.twitter.consumer_key,
    consumer_secret: config.twitter.consumer_secret,
    // app_only_auth: true,
    access_token: config.twitter.access_token,
    access_token_secret: config.twitter.access_token_secret,
    timeout_ms: 60*1000
  });

db.collection("config").findOne({}, function (err, twitconfig) {
    if (err) {
      console.error('Can\'t get config from mongodb');
      process.exit(1);
    } else { 
      var stream = twit.stream('statuses/filter', twitconfig.filter);
      
      stream.on('connected', function() {
        console.log(Date() + ': connected to Twitter');
      });
      
      stream.on('tweet', function (tweet) {
          console.log(Date() + ' new tweet ' + tweet.id_str);
          newTweet(tweet);
      });
      
      // Not sure of value add here, but take it anyway. 
      stream.on('quoted_tweet', function (tweet) {
        console.log(Date() + ' quoted tweet ' + tweet.id_str);
        newTweet(tweet);
      });
      
      function newTweet(tweet) {
        // Fit date formats for AngularMoment
        tweet.created_at = new Date(tweet.created_at);
        if (tweet.quote_status) {
          tweet.quote_status.created_at = new Date(tweet.quote_satus.created_at);
        }
        
        if(!tweet.retweeted_status) {
          io.sockets.emit('topTweet', [tweet]);
        }
        db.collection('tweets').insert(tweet, function (err, records) {
          if (err) {
            console.log('Database error: ' + err)
          } else {
            console.log(Date() + ': tweet id ' + tweet.id_str + ' inserted to mongodb');
          }
        });
      }
        
      stream.on('delete', function (deleteData) {
        db.collection('tweets').deleteOne({id_str:deleteData.delete.status.id_str}, function(err, records){
          if (err) throw err; 
          console.log(Date() + ': tweet ' + deleteData.delete.status.id_str + ' deleted');
          io.sockets.emit('deleteTweet', deleteData.delete.status.id_str);
        });
      });
      
      // bit of debugging here, needs to be handled rather than just spat out
      stream.on('limit', function (limitMessage) {
        console.log(Date() + ': limit - ');
        console.error(limitMessage);
        console.log('end of limit');
      });

      stream.on('reconnect', function (request, response, connectInterval) {
        console.log(Date() + ': reconnect: ' + connectInterval);
        console.log(JSON.stringify(response));
      })

      stream.on('parse-error', function(error) {
        console.log(Date() + ': parse-error - ');
        console.error(error);
        console.log('end of parse-error');
      });

      stream.on('error', function(error) {
        console.log(Date() + ': error - ');
        console.error(JSON.stringify(error));
        if (error.errno == -5) {
          console.log('error -5');
          process.exit(1);
        }
        console.log('end of error');
      });

      stream.on('warning', function(msg) {
        console.log(Date() + ': warning - ');
        console.error(msg);
        console.log('end of warning');
      });  
    } // end error if
  }); // end of db.config
}
})

// START THE SERVER
server.listen(3000, '127.0.0.1', function() {
  console.log(Date() + ': Express listening on port 3000')
}).on('error', function(err) {
  // Log and quit on any errors with the http server
  console.error(err);
  process.exit(1)
});