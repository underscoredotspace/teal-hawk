var routes = require('express').Router();
var db = require('./db')

routes.use(function(req, res, next) {
  console.info(Date() + ': ' + req.method + ' request for ' + req.originalUrl);
  if (!req.user) {
    res.sendStatus(401)
  } else {
    next()
  }
});

routes.get('/tweets/getColumns', function(req, res) {
  db.collection('users').find({twitter_id: req.user.user_id}, {_id: 0, columns: 1}).limit(1).toArray(function(err, user) {
    if (user[0].registered) {
      req.user.registered = true;
      req.session.save();
    }
    res.json(user[0].columns);
  });
})

routes.post('/tweets/init', function(req, res) {
  tweetColumn = req.body

  var searchQuery = {'$and': [JSON.parse(tweetColumn.parameters), {'retweeted_status':{'$exists':false}}]};
  db.collection('tweets').find(searchQuery).sort([['id_str', -1]]).limit(tweetColumn.tweetCount).toArray(function (err, tweet) {
    res.json(tweet);
  }); 
})

routes.post('/tweets/newColumn', function(req, res) {
  newColumn = req.body
  db.collection("users").update({twitter_id: req.user.user_id}, {$push: {columns: newColumn}});
  res.json(newColumn)
})

routes.post('/tweets/nextTweets', function(req, res) {
  var nextTweets = req.body
  var searchQuery = {'$and': [JSON.parse(nextTweets.parameters), {'retweeted_status':{'$exists':false}}, {id_str: {$lt: nextTweets.lastTweet}}]};
  db.collection('tweets').find(searchQuery).sort([['id_str', -1]]).limit(nextTweets.tweetCount).toArray(function (err, tweets) {
      res.json(tweets);
  }); 
})

module.exports = routes;