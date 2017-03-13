const routes = require('express').Router();
var db = require('./db');

routes.use(function(req, res, next) {
  console.info(Date() + ': ' + req.method + ' request for ' + req.originalUrl);
  // console.log(req)
  if (!req.user) {
    res.sendStatus(401)
  } else {
    next()
  }
});

routes.get('/tweets/getColumns', function(req, res) {
  db.get().collection('users').find({twitter_id: req.user.user_id}, {_id: 0, columns: 1}).limit(1).toArray(function(err, user) {
    if (user[0].registered) {
      req.user.registered = true;
      req.session.save();
    }
    res.json(user[0].columns);
  });
})

module.exports = routes;