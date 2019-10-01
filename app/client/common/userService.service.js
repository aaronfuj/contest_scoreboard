'use strict';

var _ = require('lodash');

userService.$inject = ['$http', '$q'];
function userService($http, $q) {
  var JUDGE_STRING = 'judge';
  var ADMIN_STRING = 'admin';

  var JUDGE_VALUE = 1;
  var ADMIN_VALUE = 2;

  var ROLE_VALUE_MAP = {
    judge: JUDGE_VALUE,
    admin: ADMIN_VALUE
  };

  var rolePromise;

  var convertRoleStringToValue = function (roleString) {
    return ROLE_VALUE_MAP[roleString] || 0;
  };

  var isRole = function (mongoUserObject, role) {
    if (_.has(mongoUserObject, 'local.role')) {
      return mongoUserObject.local.role === role;
    }
    else {
      return false;
    }
  };

  var getRole = function () {
    if (!rolePromise) {
      rolePromise = $http.get('/api/user');
    }

    return rolePromise;
  };

  var getRoleValue = function () {
    var roleValuePromise = getRole().then(
      function (response) {
        if (_.has(response.data, 'local.role')) {
          return convertRoleStringToValue(response.data.local.role);
        }
        else {
          return 0;
        }
      },
      function (response) {
        return 0;
      }
    );

    return roleValuePromise;
  };

  var isAdmin = function () {
    var isAdminPromise = getRole().then(
      function (response) {
        return isRole(response.data, ADMIN_STRING);
      },
      function (response) {
        return false;
      }
    );
    return isAdminPromise;
  };

  var isJudge = function () {
    return getRoleValue().then(function (roleValue) {
      return roleValue >= JUDGE_VALUE;
    });
  };

  var getUser = function () {
    var deferred = $q.defer();
    getRole().then(
      function (response) {
        var user = _.assign({}, response.data);
        user.username = response.data.local.username;
        user.isAdmin = isRole(user, ADMIN_STRING);
        user.isJudge = isRole(user, JUDGE_STRING);
        user.role = user.local.role;
        deferred.resolve(user);
      },
      function (response) {
        deferred.reject(response);
      }
    );
    return deferred.promise;
  };

  var setUserToScopeAsync = function (scope) {
    var userPromise = getUser();
    userPromise.then(
      function (user) {
        scope.user = user;
      },
      function (failed) {
        scope.user = {};
        console.error('Unable to get the user');
        console.error(failed);
      }
    );
    return userPromise;
  };

  return {
    getRole: getRole,
    getUser: getUser,
    isAdmin: isAdmin,
    isJudge: isJudge,
    setUserToScopeAsync: setUserToScopeAsync
  };
}

module.exports = userService;