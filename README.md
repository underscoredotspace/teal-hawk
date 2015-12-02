# teal-hawk  

Teal Hawk is a prototype Twitter analysis tool for real-time analysis of a brand's mentions. The intention is to allow real-time and business improvement analysts to gain actionable insight into what customers/press/moaners are saying about their brand.  

Project now based on node.js, mongodb and socket.io. Everything needed to run should be here: 

```
npm install
```

This said - the main intention is to learn JS and Angular properly with limited time, so **don't try to use this in it's development state** please. 
  
config.js must be created in project root with the following:  
  
```
// Twitter API keys and tokens  
exports.consumer_key = 'consumer_key';  
exports.consumer_secret = 'consumer_secret';  
exports.access_token = 'access_token';  
exports.access_token_secret = 'access_token_secret';

// Stream parameters to get anil's @ mentions and his tweets/replies
exports.twitter = {'track': 'anildash', 'follow': '36823'};
```
