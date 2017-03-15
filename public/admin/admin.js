thAdmin = angular.module('thAdmin', ['angularMoment']).constant('_', window._);

thAdmin.factory('userAPI',function ($http) {
    return {
        waitingauth: function(params, callback) {
            $http.get('/api/admin/user/waitingauth').then(function (res) {
                console.log(res);
                callback(null, res.data.users);
            }, function(res) {
                callback(res, null);
            });
        }, 
        delUser: function(user_id, callback) {
            $http.get('/api/admin/del/'+user_id).then(function (res) {
                callback(null, res.data);
            }, function(res) {
                callback(res, null);
            });
        }, 
        authUser: function(user_id, callback) {
            $http.get('/api/admin/auth/'+user_id).then(function (res) {
                callback(null, res.data);
            }, function(res) {
                callback(res, null);
            });
        }
    } 
});

thAdmin.controller('thUserAdmin', function ($scope, userAPI) {
    function init() {
        userAPI.waitingauth('', function(err, users) {
            if (!err) {
                $scope.waitingAuth = users;
                return true;
            } else {
                console.log(err);
                return false;
            }
        });
    }

    $scope.init = init();

    $scope.authUser = function(user_id) {
        userAPI.authUser(user_id, function(err, res) {
            if (!err) {
                console.log(res)
                init();
            } else {
                console.log(err);
            }
        });
    };

    $scope.delUser = function(user_id) {
        userAPI.delUser(user_id, function(err, res) {
            if (!err) {
                console.log(res)
                init();
            } else {
                console.log(err);
            }
        });
    };
});

thAdmin.directive('thHover', function($timeout) {
  return {
    restrict: 'A',
    scope: true,
    link: function(scope, element, attrs) {
      element.on('mouseenter', function(event) {
        element.addClass('hover');
      });
      element.on('mouseleave', function(event) {
        element.removeClass('hover');
      });

      element.on('click', function(event) {
        element.removeClass('hover');
      });
      element.on('mousemove', function(event) {
        element.addClass('hover');
      });
    }
  }
});