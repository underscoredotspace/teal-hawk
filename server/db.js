var MongoClient = require('mongodb').MongoClient

var state = {
  db: null,
}

exports.connect = function(url, done) {
  if (state.db) return done()

  MongoClient.connect(url, function(err, db) {
    if (err) return done(err)
    state.db = db
    console.log(Date() + ': connected to ' + url);
    done()
  })
}

exports.collection = function(collectionName) {
  if (!collectionName) {
    return null
  } else {
    return state.db.collection(collectionName)
  }
}