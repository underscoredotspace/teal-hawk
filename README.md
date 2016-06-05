# teal-hawk  

Teal Hawk is a Twitter analysis tool for real-time analysis of a brand's mentions. The intention is to allow real-time and business improvement analysts to gain actionable insight into what customers/press/moaners are saying about their brand.

![screenshot](https://raw.githubusercontent.com/underscoredotspace/teal-hawk/master/teal-hawk.png "Screenshot of Teal Hawk")

The project is made with  node.js, mongodb and socket.io, along with passport-twitter login. Other than mongodb and node.js itself, everything needed to run should be here: 

```
npm install
```
  
config.js must be created in project root with the following:  
  
```javascript
module.exports = {
  twitter: {
    consumer_key: '',
    consumer_secret: '',
    access_token: '',
    access_token_secret: '',
    callbackURL: 'http://127.0.0.1:3000/login/twitter/callback'
  },
  passport: {
    key: 'teal hawk',
    secret: 'keyboard cat'
  }
};
```

In monogodb you must input something like the below. Replace ````name```` and ````twitter_id```` with your own for access to the Deck. Empty ````columns```` element **is** currently required.  

```javascript
db.users.insert({name: "_DotSpace", twitter_id: "42383066",	columns: []})
db.config.insert({filter:{track: ['_DotSpace'], follow: ['42383066']}})
```

Registration, and column creation processes are needed to sort this. 

If you like tracking from PIWIK or Google Analytics, put your code in a file called ````tracking.js```` - no need for any NOSCRIPT shit as this app requires JS to do anything.