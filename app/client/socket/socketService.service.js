'use strict';

var io = require('socket.io-client');

socket.$inject = ['$rootScope'];
function socket($rootScope) {
  var SOCKET_PREFIX = 'socket:';

  var TIMER_EVENT = 'timer';
  var SCORE_UPDATE_EVENT = 'score:update';
  var SCORE_MODIFIED_EVENT = 'score:modified';
  var HEAT_UPDATE_EVENT = 'heat:update';
  var SETTINGS_UPDATE_EVENT = 'settings:update';

  var socket = io.connect();

  var forward = function (eventName) {
    socket.on(eventName, function () {
      var args = arguments;
      var prefixedEvent = SOCKET_PREFIX + eventName;
      Array.prototype.unshift.call(args, prefixedEvent);
      $rootScope.$apply(function () {
        $rootScope.$broadcast.apply($rootScope, args);
      });
    })
  };

  forward(TIMER_EVENT);
  forward(SCORE_UPDATE_EVENT);
  forward(SCORE_MODIFIED_EVENT);
  forward(HEAT_UPDATE_EVENT);
  forward(SETTINGS_UPDATE_EVENT);

  return {
    SOCKET_TIMER_EVENT: (SOCKET_PREFIX + TIMER_EVENT),
    SOCKET_SCORE_UPDATE_EVENT: (SOCKET_PREFIX + SCORE_UPDATE_EVENT),
    SOCKET_SCORE_MODIFIED_EVENT: (SOCKET_PREFIX + SCORE_MODIFIED_EVENT),
    SOCKET_HEAT_UPDATE_EVENT: (SOCKET_PREFIX + HEAT_UPDATE_EVENT),
    SOCKET_SETTINGS_UPDATE_EVENT: (SOCKET_PREFIX + SETTINGS_UPDATE_EVENT),

    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
}

module.exports = socket;