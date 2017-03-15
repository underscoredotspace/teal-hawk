var routes = require('express').Router();
var db = require('./db')

routes.use(function(req, res, next) {
  if (req.user.admin==true) {
    next();
  } else {
    res.sendStatus(401);
  }
})

routes.get('/:func/:param', function(req, res) {
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
/*
    // Tell client to log user out and disconnect their socket
    var userSockets = passportSocketIo.filterSocketsByUser(io, function(user){
      return user.user_id == req.params.param;
    });
    userSockets.forEach(function(socket) {
      socket.emit('logout', 'Your account has been deleted\nYou will now be logged out');
      socket.disconnect();
    });
    console.log({sockets: userSockets.length});
*/

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

module.exports = routes