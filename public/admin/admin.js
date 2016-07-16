thAdmin = angular.module('thAdmin', []).constant('_', window._);

thAdmin.factory('userAPI',function ($http) {
    return {
        waitingauth: function(params, callback) {
            $http.get('api/user/waitingauth').then(function (res) {
                console.log(res);
                callback(null, res.data.users);
            }, function(res) {
                callback(res, null);
            });
        }, 
        delUser: function(user_id, callback) {
            $http.get('api/del/'+user_id).then(function (res) {
                callback(null, res.data);
            }, function(res) {
                callback(res, null);
            });
        }, 
        authUser: function(user_id, callback) {
            $http.get('api/auth/'+user_id).then(function (res) {
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
            } else {
                console.log(err);
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