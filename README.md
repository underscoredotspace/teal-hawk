# teal-hawk  

Teal Hawk is a prototype Twitter analysis tool for real-time analysis of a brand's mentions. The intention is to allow real-time and business improvement analysts to gain actionable insight into what customers/press/moaners are saying about their brand.  

Project now based on node.js, mongodb and socket.io with passport-twitter login. Everything needed to run should be here: 

```
npm install
```

This said - the main intention is to learn JS and Angular properly with limited time, so **don't try to use this in it's development state** please. 
  
config.js must be created in project root with the following:  
  
```
module.exports = {
  twitter: {
    consumer_key: '',
    consumer_secret: '',
    access_token: '',
    access_token_secret: '',
    callbackURL: 'http://127.0.0.1:3000/login/twitter/callback',
    filter: {'track': '_DotSpace', 'follow': '42383066'}
  },
  passport: {
    key: 'teal hawk',
    secret: 'keyboard cat'
  }
};
```

If you like tracking from PIWIK or Google Analytics, put your code in a file called ````tracking.js```` - no need for any NOSCRIPT shit as this app requires JS to do anything. 