# teal-hawk  

Teal Hawk is a prototype Twitter analysis tool for real-time analysis of a brand's mentions. The intention is to allow real-time and business improvement analysts to gain actionable insight into what customers/press/moaners are saying about their brand.  

This said - the main intention is to learn JS and Angular properly with limited time, so **don't try to use this in it's development state** please. 
  
config.php must be created with the following:  
  
```php
	<?php  
	// Local SQL Server credentials  
	$sql_dbname = "DBNAME";  
	$sql_host = "DBHOSTNAME";  
	$sql_user = "DBUSERNAME";  
	$sql_pass = "DBPASSWORD";  
	
	// Twitter API keys and tokens  
	$consumer_key = "TWITTERCONSUMERKEY";  
	$consumer_secret = "TWITTERCONSUMERSECRET";  
	$access_token = "TWITTERACCESSTOKEN";  
	$access_secret = "TWITTERACESSSECRET";  
	?>
```

You will also need some method if capturing tweets from the Stream API. We are using [Phirehose](https://github.com/fennb/phirehose) which is not included in this codebase.  
