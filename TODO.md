#Interface for creating/editing/deleting tweetColumn
- [X] Load column data from database to front-end
- [X] Ability to add new tweet column
- [X] Parse filter parameters from Mongo collection for editing
- [X] Edit existing column
- [x] Move column left or right
- [x] Save edited/new filter parameters to Mongo collection
- [X] Delete tweet column

#Stylesheet and front end structure changes
- [ ] New stylesheet with more flexbox
- [ ] Tweet directive
- [ ] Tweets to be held in columns[n].tweets / column.tweets

#Authentication
- [X] Registration request
- [ ] Registration approval by admin user
- [ ] Email notification of registrations?
- [ ] Real-time notification and approval of registration
- [ ] Holding screen for registation requester that moves once approved. 
- [x] Login with Twitter
- [x] Log out
- [x] Validation for socket requests

#Better communication with user
- [ ] Toast messages
- [ ] User warnings (e.g. when column can't be moved)
- [ ] User error messages?
- [ ] Persistent message when offline
- [ ] New toast when back online

#Tweet Deck Features
- [ ] Filter by conversation
- [ ] User stats available on hover of profile image
- [ ] Replace any remaining t.co link text with the real one
- [ ] Pull Search out to it's own directive and re-style

#Admin pages
- [ ] Authorise new user registration
- [ ] Delete users
- [X] Get stream parameters from database
- [ ] Update stream parameters for server-side app.js and restart as required
- [ ] First run process to create defaults in db etc. 

#Efficiency/Correctness
- [X] Decide on _.each,  angular.forEach, or Array.forEach by case
- [X] Decide on _.extend or angular.extend by case
- [x] Move underscore-query requirement to front-end for tweet validation
- [ ] More functions. Currently too much in directives. 
- [ ] Test for every function

#Look & Feel
- [ ] Need ~~front-end framework (Bootstrap or something) or~~ SASS for styles. Full rebuild needed here. 
- [ ] More loading animation
- [ ] Better handling of new tweets. Not good to burst into view, especially for high volume situations. 