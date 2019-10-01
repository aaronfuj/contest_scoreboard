'use strict';

var _ = require('lodash');

var heatControl = {
  templateUrl: '/heats/heatControl/heatControl.html',
  bindings: {
    heatId: '<',
    heat: '<',
    previousHeat: '<',
    nextHeat: '<',
    user: '<',
    isAdmin: '<',
    onRidersChanged: '&'
  },
  controller: ['$scope',
    'colorService', 'TabulationService', 'settingsService', 'socket', 'timeService',
    'heatService', 'riderService', 'headerService',
    function($scope,
             colorService, TabulationService, settingsService, socket, timeService,
             heatService, riderService) {
      var ctrl = this;

      ctrl.colors = colorService.colors;

      var updateHeatAndRiders = function(heatId) {
        heatService.getHeat(heatId).then(
          function(response) {
            var heat = response.data;
            ctrl.heatIsActive = heat.isActive;

            riderService.getRidersInDivision(heat.round.division._id).then(
              function(response) {
                ctrl.allRiders = response.data;
                initializeNextRider();
              },
              function(response) {
                console.error('Unable to get the riders information for division' + response);
              }
            );
          },
          function(response) {
            console.error('Unable to get the desired heat' + response);
          }
        );
      };

      ctrl.isRiderInHeat = function(rider) {
        if(ctrl.heat) {
          return !!_.find(ctrl.heat.riders, function(heatRider) { return rider._id == heatRider.rider._id; });
        }
        else {
          return false;
        }
      };

      ctrl.isColorUsedInHeat = function(color) {
        if(ctrl.heat) {
          return !!_.find(ctrl.heat.riders, function(heatRider) { return color.value == heatRider.color; });
        }
        else {
          return false;
        }
      };

      ctrl.addRider = function(selectedRider, selectedColor) {
        heatService.addRiderToHeat(ctrl.heat._id, selectedRider._id, selectedColor.value).then(
          function(response) {
            ctrl.heat = response.data;

            ctrl.onRidersChanged({
              riders: ctrl.heat.riders
            });

            initializeNextRider();
          },
          function(response) {
            console.log('Unable to add rider to heat ' + response);
          }
        );
      };

      ctrl.removeRider = function(rider) {
        var heatRiderId = rider._id;
        var confirmationMessage = 'Are you sure you want to remove ' + rider.name + ' from the heat?';
        if(confirm(confirmationMessage)) {
          heatService.removeRiderFromHeat(ctrl.heat._id, heatRiderId).then(
            function (response) {
              ctrl.heat = response.data;

              ctrl.onRidersChanged({
                riders: ctrl.heat.riders
              });
            },
            function (response) {
              console.log('Unable to remove rider from heat: ' + response);
            }
          );
        }
      };

      var initializeNextRider = function() {
        if(ctrl.allRiders) {
          for(var riderIndex=0; riderIndex < ctrl.allRiders.length; riderIndex++) {
            var currentRider = ctrl.allRiders[riderIndex];
            if(!ctrl.isRiderInHeat(currentRider)) {
              ctrl.selectedRider = currentRider;
              break;
            }
          }
        }

        if(ctrl.colors) {
          for(var colorIndex=0; colorIndex < ctrl.colors.length; colorIndex++) {
            var currentColor = ctrl.colors[colorIndex];
            if(!ctrl.isColorUsedInHeat(currentColor)) {
              ctrl.selectedColor = currentColor;
              break;
            }
          }
        }
      };


      ctrl.timerValue = 'N/A';
      $scope.$on(socket.SOCKET_TIMER_EVENT, function(event, data) {
        if(data.heatId === ctrl.heatId) {
          ctrl.timerValue = timeService.createMinutesSecondsString(data.secondsLeft);
        }
      });

      var activateHeat = function(heatId) {
        setHeatChanging(false);
        heatService.activateHeat(heatId).then(
          function(response) {
            ctrl.heat = response.data;
            ctrl.heatIsActive = ctrl.heat.isActive;
            setHeatChanging(false);
          },
          function() {
            console.log("Unable to deactivate heat");
            setHeatChanging(false);
          }
        );
      };
      ctrl.activateHeat = activateHeat;

      var setHeatChanging = function(heatChanging) {
        ctrl.heatChanging = heatChanging;
      };

      var deactivateHeat = function(heatId) {
        setHeatChanging(true);
        heatService.deactivateHeat(heatId).then(
          function(response) {
            ctrl.heat = response.data;
            ctrl.heatIsActive = ctrl.heat.isActive;
            setHeatChanging(false);
          },
          function(response) {
            console.log("Unable to deactivate heat" + response);
            setHeatChanging(false);
          }
        );
      };
      ctrl.deactivateHeat = deactivateHeat;

      ctrl.changeHeatStatus = function(enableHeat, heatId) {
        if(enableHeat) {
          activateHeat(heatId);
        }
        else {
          deactivateHeat(heatId);
        }
      };



      ctrl.$onChanges = function(changesObj) {
        if(changesObj.manualRefresh || changesObj.heatId) {

          if(ctrl.heatId) {
            updateHeatAndRiders(ctrl.heatId);
          }
        }
      }
    }
  ]
};

module.exports = heatControl;