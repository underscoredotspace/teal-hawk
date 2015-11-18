tweetApp.directive('focusInput', function($timeout) {
  return {
    link: function(scope, element, attrs) {
      element.bind('click', function() {
        $timeout(function() {
          element.parent().find('input')[0].focus();
        });
      });
    }
  };
});
