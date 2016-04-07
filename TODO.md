#Interface for creating/editing/deleting tweetColumn
- [X] Load column data from database to front-end
- [X] Ability to add new tweet column
- [X] Parse filter parameters from Mongo collection for editing
- [X] Edit existing column
- [x] Move column left or right
- [ ] ~~Show preview results~~
- [x] Save edited/new filter parameters to Mongo collection
- [X] Delete tweet column

#Authentication
- [ ] Registration (with bad user route)
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
- [X] Appropriate route for new user with no columns
- [ ] Replace any remaining t.co link text with the real one

#Admin pages
- [ ] Authorise new user registration
- [ ] Delete users
- [ ] Update stream parameters for server-side app.js and restart as required

#Algorithms
- [X] Decide on _.each,  angular.forEach, or Array.forEach by case
- [X] Decide on _.extend or angular.extend by case