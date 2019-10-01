'use strict';

var _ = require('lodash');

var timerControl = {
  templateUrl: '/heats/timer/timerControl.html',
  bindings: {
    heatId: '<',
    enabled: '<'
  },
  controller: [ 'socket',
    function(socket) {

      var ctrl = this;

      ctrl.setTimer = function(timeMinutes) {
        if(timeMinutes && _.isNumber(timeMinutes) && timeMinutes > 0 && timeMinutes < 100) {
          var timeSeconds = timeMinutes * 60;

          socket.emit('heat:timer:set', {
            heatId: ctrl.heatId,
            timeSeconds: timeSeconds,
            secondsCounter: timeSeconds
          });
        }
        else {
          alert("Please enter a value between 0 and 100");
        }
      };

      ctrl.startTimer = function() {
        socket.emit('heat:timer:start', {
          heatId: ctrl.heatId
        });
      };

      ctrl.pauseTimer = function() {
        socket.emit('heat:timer:pause', {
          heatId: ctrl.heatId
        });
      };

      ctrl.stopTimer = function() {
        socket.emit('heat:timer:stop', {
          heatId: ctrl.heatId
        });
      };

      ctrl.$onChanges = function(changesObj) {
        if (changesObj.name) {
          ctrl[name] = changesObj.currentValue;
        }
      }
    }
  ]
};

module.exports = timerControl;