'use strict';

var riderScoreEntry = {
  templateUrl: '/clipboard/entry/riderScoreEntry.html',
  bindings: {
    userId: '<',
    heat: '<',
    heatRider: '<',
    lastWaveNumber: '<',
    enableLeftRightRule: '<',
    onSubmit: '&'
  },
  controller: [ '$timeout', 'scoreService', 'colorService',
    function($timeout, scoreService, colorService) {

      var MAJOR_INTERFERENCE = 'major';
      var MINOR_INTERFERENCE = 'minor';

      var ctrl = this;

      var clearSendingScorePromise = undefined;
      var isSendingScore = undefined;

      var latestSubmissionInfo = undefined;

      ctrl.getLighterColor = colorService.getLighterColor;

      var setSendingScore = function() {
        isSendingScore = true;
        if(clearSendingScorePromise) {
          $timeout.cancel(clearSendingScorePromise);
          clearSendingScorePromise = undefined;
        }
      };

      var clearRiderSendingScore = function () {
        isSendingScore = false;
        clearSendingScorePromise = $timeout(function () {
          isSendingScore = false;
          clearSendingScorePromise = undefined;
        }, 500);
      };

      var adjustScore = function (incrementValue) {
        if (isNaN(ctrl.currentValue)) {
          ctrl.currentValue = 0;
          return;
        }

        ctrl.currentValue += incrementValue;
        ctrl.currentValue = parseFloat(ctrl.currentValue.toFixed(1));

        if (ctrl.currentValue < 0) {
          ctrl.currentValue = 0;
        }
        else if (ctrl.currentValue > 10) {
          ctrl.currentValue = 10;
        }
      };

      ctrl.setDirection = function (direction, interference, interferenceType) {
        latestSubmissionInfo = {
          direction: direction,
          isInterference: !!interference,
          interferenceType: interferenceType
        };
      };

      ctrl.submitScore = function() {

        var riderSubmissionInfo = latestSubmissionInfo || {
            direction: 'none',
            isInterference: false,
            interferenceType: null
          };

        if (riderSubmissionInfo.isInterference) {
          var interferenceType = riderSubmissionInfo.interferenceType ?
            riderSubmissionInfo.interferenceType.toUpperCase() :
            '';

          if (!confirm("Are you sure you want to submit " + interferenceType + " interference?")) {
            return;
          }
          else {

            // Force a score value if the ride was an interference but no score was entered
            if (ctrl.currentValue == null || ctrl.currentValue == undefined || ctrl.currentValue <= 0) {
              ctrl.currentValue = 0.1;
            }
          }
        }

        setSendingScore();

        var riderId = ctrl.heatRider.rider._id;
        var requestedWaveNumber = (ctrl.lastWaveNumber || 0) + 1; // Increment based off of last known

        // var scoreData = {
        //   judge: $scope.userId,
        //   heat: heat._id,
        //   rider: riderId,
        //   time: Date.now(),
        //   direction: riderSubmissionInfo.direction,
        //   waveNumber: requestedWaveNumber,
        //   value: rider.currentValue,
        //   isInterference: riderSubmissionInfo.isInterference
        // };

        if (isNaN(ctrl.currentValue)) {
          ctrl.onSubmit({
            results: {
              success: false,
              message: 'Number was invalid'
            }
          });

          ctrl.currentValue = null;

          clearRiderSendingScore();
        }
        else if(ctrl.currentValue <= 0 || ctrl.currentValue > 10) {
          ctrl.currentValue = null;

          clearRiderSendingScore();
        }
        else {

          scoreService.createScore(
            ctrl.userId,
            ctrl.heat._id,
            riderId,
            ctrl.currentValue,
            requestedWaveNumber,
            riderSubmissionInfo.direction,
            riderSubmissionInfo.isInterference,
            riderSubmissionInfo.interferenceType
          ).then(
            function(response) {
              var score = response.data;

              ctrl.lastWaveNumber = score.waveNumber;

              ctrl.onSubmit({
                results: {
                  success: true,
                  score: score
                }
              });
              ctrl.currentValue = null;
              clearRiderSendingScore();
            },
            function(response) {
              console.error('Error submitting score ' + JSON.stringify(response.data));
              ctrl.onSubmit({
                results: {
                  success: false
                }
              });
              clearRiderSendingScore();
            }
          );
        }
      };

      ctrl.clearScore = function() {
        ctrl.currentValue = undefined;
      };

      ctrl.isSendingScore = function() {
        return isSendingScore;
      };

      ctrl.incrementValue = function() {
        adjustScore(0.1);
      };

      ctrl.decrementValue = function() {
        adjustScore(-0.1);
      };

      ctrl.validateScoreOnBlur = function () {
        if (isNaN(ctrl.currentValue)) {
          ctrl.currentValue = 0;
        }
      };

      var handleRiderChanges = function(color) {
        ctrl.sliderOptions = {
          floor: 0,
          ceil: 10,
          step: 0.1,
          precision: 1,
          showTicksValues: true,
          getPointerColor: function () {
            return color;
          }
        };

        ctrl.currentValue = 0;
        ctrl.textColor = colorService.getContrastingColor(color);
      };

      ctrl.$onInit = function() {
      };

      ctrl.$onChanges = function(changesObj) {
        if(changesObj.heatRider) {
          var color = changesObj.heatRider.currentValue.color;
          handleRiderChanges(color);
        }
      };


    }
  ]
};

module.exports = riderScoreEntry;