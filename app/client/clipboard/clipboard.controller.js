'use strict';

var _ = require('lodash');

ClipboardCtrl.$inject = ['$scope', '$timeout', '$sce',
  'heatService', 'colorService', 'settingsService', 'socket', 'timeService', 'userService', 'scoreService',
  'headerService'];

function ClipboardCtrl($scope, $timeout, $sce,
            heatService, colorService, settingsService, socket, timeService, userService, scoreService,
            headerService) {

  headerService.updateHeader('Clipboard');

  $scope.enableLeftRightRule = settingsService.isLeftRightRuleEnabled();
  $scope.scoresPerRider = {};
  $scope.waveNumberPerRider = {};
  $scope.hasToast = false;
  $scope.toast = {
    color: 'black',
    message: null
  };
  $scope.getLighterColor = colorService.getLighterColor;

  var refreshSlider = function () {
    $timeout(function () {
      $scope.$broadcast('rzSliderForceRender');
    });
  };

  // TODO: This should be extracted out into a better approach...
  userService.getRole().then(
    function (response) {
      $scope.userId = response.data._id;
    }
  );

  var initializePage = function () {
    // TODO: This is temporary clear. For multi heat changes dont do this
    $scope.scoresPerRider = {};

    settingsService.getSettingsPromise().then(function (response) {
      $scope.enableLeftRightRule = response.data.enableLeftRightRule;
    });

    $scope.waveNumberPerRider = {};

    // Load in all of the active heats that we will be able to judge
    heatService.getActiveHeats().then(
      function (response) {
        $scope.activeHeats = response.data;

        _.forEach($scope.activeHeats, function (heat) {
          heat.timerValue = 'N/A';

          _.forEach(heat.riders, function (rider) {
            rider.textColor = colorService.getContrastingColor(rider.color);
          });
        });

        // Load in all of the current scores and store them into the scope
        scoreService.getScoresForActiveHeats().then(
          function (response) {
            $scope.scores = response.data;

            _.forEach(response.data, function (score) {

              var currentRiderId = score.rider._id;

              if ($scope.scoresPerRider[currentRiderId]) {
                $scope.scoresPerRider[currentRiderId].push(score);
                $scope.waveNumberPerRider[currentRiderId] = Math.max($scope.waveNumberPerRider[currentRiderId], score.waveNumber);
              }
              else {
                $scope.scoresPerRider[currentRiderId] = [score];
                $scope.waveNumberPerRider[currentRiderId] = score.waveNumber;
              }
            });

          },
          function (response) {
            console.error('Unable to get the current scores: ' + JSON.stringify(response));
          }
        );

        refreshSlider();
      },
      function (response) {
        console.error('Unable to get the active heats: ' + JSON.stringify(response));
      }
    );
  };

  initializePage();

  $scope.handleEntrySubmit = function (submissionResults, heatRider) {
    if (submissionResults.success) {
      var score = submissionResults.score;
      var riderId = score.rider;

      // Update the scores per rider map to show all the current scores for the heat
      if ($scope.scoresPerRider[riderId]) {
        $scope.scoresPerRider[riderId].push(score);
      }
      else {
        $scope.scoresPerRider[riderId] = [score];
      }

      // Construct the toast to show on this page
      var directionString = 'SCORE';
      if (score.direction && score.direction.toLowerCase() != 'none') {
        directionString = score.direction.toUpperCase();
      }

      if (score.isInterference) {
        showToast('INTERFERENCE: <strong>' + score.value + '</strong>', heatRider.color);
      }
      else {
        showToast(directionString + ': <strong>' + score.value + '</strong>', heatRider.color);
      }
    }
    else {
      if (submissionResults.message) {
        showToast('ERROR <strong> ' + submissionResults.message + ' </strong>', red);
      }
      else {
        showToast('ERROR <strong> Failed submit </strong>', 'red');
      }
    }
  };

  /**
   * Sets scope variables with information for showing a toast on this page.
   */
  var showToast = function (message, color) {
    $scope.hasToast = true;
    $scope.toast.message = $sce.trustAsHtml(message);
    $scope.toast.color = color;

    $timeout(function () {
      $scope.hasToast = false;
      $scope.toast.message = '';
    }, 1250);
  };

  /**
   *  Function to filter out the scores to show for a rider in a particular
   *  direction.
   */
  $scope.getScores = function (riderId, direction) {
    var scores = $scope.scoresPerRider[riderId];

    if (direction) {
      scores = _.filter(scores, function (score) {
        return direction == score.direction;
      });
    }

    return scores;
  };

  $scope.$on(socket.SOCKET_TIMER_EVENT, function (event, data) {
    var heat = _.find($scope.activeHeats, function (heat) {
      return data.heatId == heat._id;
    });
    if (heat) {
      var displayString = timeService.createMinutesSecondsString(data.secondsLeft);
      heat.timerValue = displayString;
    }
  });

  $scope.$on(socket.SOCKET_HEAT_UPDATE_EVENT, function () {
    initializePage();
  });

  $scope.$on(socket.SOCKET_SCORE_MODIFIED_EVENT, function (event, data) {
    if ($scope.userId == data.score.judge._id) {

      var heat = _.find($scope.activeHeats, function (heat) {
        return data.score.heat._id == heat._id;
      });
      if (heat) {
        initializePage();
      }
    }
  });

  $scope.$on(socket.SOCKET_SETTINGS_UPDATE_EVENT, function () {
    initializePage();
  });
}

module.exports = ClipboardCtrl;