tweetApp.filter('highlight', function () {
  return function(text, phrase) {
    if (phrase) {
      text = text.replace(new RegExp('('+phrase+')(?![^<]*>)', 'gi'), '<span class="highlighted">$1</span>');
    }
    return text;
  }   
});

// Proxies profile images, but should be able to handle any image with little work.
tweetApp.filter('proxy_image', function() {
  return function(text) {
    var out = "";
    // to catch new egg profile pics
    if (text.search("http://abs.twimg.com") >-1) {
      out = "img.php?url=" + text;
    } else {
      // to catch normal profile images
      out = text.replace("http://pbs.twimg.com/profile_images/", "img.php?url=");
    }
    return out;
  };
});  

// Below not written by me. I think the two linky functions should be one
tweetApp.filter('linkyUnsanitized', ['$sanitize', function($sanitize) {  
  var LINKY_URL_REGEXP =  
        /((ftp|https?):\/\/|(mailto:)?[A-Za-z0-9._%+-]+@)\S*[^\s.;,(){}<>]/,  
      MAILTO_REGEXP = /^mailto:/;  
  
  return function(text, target) {  
    if (!text) return text;  
    var match;  
    var raw = text;  
    var html = [];  
    var url;  
    var i;  
    while ((match = raw.match(LINKY_URL_REGEXP))) {  
      // We can not end in these as they are sometimes found at the end of the sentence  
      url = match[0];  
      // if we did not match ftp/http/mailto then assume mailto  
      if (match[2] == match[3]) url = 'mailto:' + url;  
      i = match.index;  
      addText(raw.substr(0, i));  
      addLink(url, match[0].replace(MAILTO_REGEXP, ''));  
      raw = raw.substring(i + match[0].length);  
    }  
    addText(raw);  
    return html.join('');  
  
    function addText(text) {  
      if (!text) {  
        return;  
      }  
      html.push(text);  
    }  
  
    function addLink(url, text) {  
      html.push('<a ');  
      if (angular.isDefined(target)) {  
        html.push('target="');  
        html.push(target);  
        html.push('" ');  
      }  
      html.push('href="');  
      html.push(url);  
      html.push('">');  
      addText(text);  
      html.push('</a>');  
    }  
  };  
}]); 

tweetApp.filter('tweetLinky',['$filter',
    function($filter) {
        return function(text, target) {
            if (!text) return text;
    
            var replacedText = $filter('linky')(text, target);
            var targetAttr = "";
            if (angular.isDefined(target)) {
                targetAttr = ' target="' + target + '"';
            }
            // replace #hashtags and send them to twitter
            var replacePattern1 = /(^|\s)#(\w*[a-zA-Z_]+\w*)/gim;
            replacedText = text.replace(replacePattern1, '$1<a href="https://twitter.com/search?q=%23$2"' + targetAttr + '>#$2</a>');
            // replace @mentions but keep them to our site
            var replacePattern2 = /(^|\s)\@(\w*[a-zA-Z_]+\w*)/gim;
            replacedText = replacedText.replace(replacePattern2, '$1<a href="https://twitter.com/$2"' + targetAttr + '>@$2</a>');
            return replacedText;
        };
    }   
]); 
