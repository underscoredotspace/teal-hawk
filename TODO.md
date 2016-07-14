#Interface for creating/editing/deleting tweetColumn
- [X] Load column data from database to front-end
- [X] Ability to add new tweet column
- [X] Parse filter parameters from Mongo collection for editing
- [X] Edit existing column
- [X] Move column left or right
- [X] Save edited/new filter parameters to Mongo collection
- [X] Delete tweet column
- [X] Get $scope.listen_users data from config colleciton in Mongo

#Stylesheet and front end structure changes
- [X] New stylesheet with more flexbox
- [X] Tweet directive
- [X] Tweet Search directive
- [ ] Tweets to be held in columns[n].tweets / column.tweets

#Authentication
- [X] Registration request
- [ ] Registration approval by admin user
- [ ] Email notification of registrations?
- [ ] Real-time notification and approval of registration
- [X] Holding screen for registation requester that moves once approved. 
- [X] Login with Twitter
- [X] Log out
- [X] Validation for socket requests

#Better communication with user
- [ ] Modal dialogs for confirmation
- [X] Toast messages
- [X] User warnings (e.g. when column can't be moved)
- [X] User error messages?
- [X] Persistent message when offline
- [X] New toast when back online

#Tweet Deck Features
- [ ] Filter by conversation
- [ ] User stats available on hover of profile image
- [ ] Replace any remaining t.co link text with the real one
- [X] Pull Search out to it's own directive and re-style

#Admin pages
- [ ] Delete users
- [ ] Delete session/log user out
- [X] Get stream parameters from database
- [ ] Update stream parameters for server-side app.js and restart as required
- [ ] First run process to create defaults in db etc. 

#Efficiency/Correctness
- [X] Decide on _.each,  angular.forEach, or Array.forEach by case
- [X] Decide on _.extend or angular.extend by case
- [X] Move underscore-query requirement to front-end for tweet validation
- [ ] More functions. Currently too much in directives. 
- [ ] Test for every function
- [ ] Find out/consider what should be express route with json response, and what should stay socket

#Look & Feel
- [X] Need ~~front-end framework (Bootstrap or something) or~~ SASS for styles. Full rebuild needed here. 
- [ ] Much more ~~loading~~ animation
- [ ] Better handling of new tweets. Not good to burst into view, especially for high volume situations. 