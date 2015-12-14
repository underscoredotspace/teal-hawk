#Filter for tweetColumn

- Take filter parameters from Mongo collection.  
- In server app.js within InitRequest, NextTweets and UpdateRequest.  
- When new tweet received in client.  

#Interface for creating/editing/deleting tweetColumn

- Parse filter parameters from Mongo collection for editing.  
- Show preview results (perhaps using REST).  
- Save edited/new filter parameters to Mongo collection.  
- Update stream parameters for server-side app.js and restart as required.  
- Delete tweetColumn.  

#Authentication
- Registration, 
- Logins, 
-- with Google, 
-- Facebook
-- Twitter
-- etc.

#Handle delete requests
- move to Twitter npm package to get *all* data [done]
- handle difference between data types recieved in stream [started]
- when delete recieved:
-- remove from mongodb [done]
-- remove from any client views via socket.io
