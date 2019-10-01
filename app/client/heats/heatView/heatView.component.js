'use strict';

var _ = require('lodash');

var heatView = {
  templateUrl: '/heats/heatView/heatView.html',
  bindings: {
    heatId: '<',
    user: '<',
    isAdmin: '<',
    allScores: '<',
    isLive: '<',
    manualRefresh: '<'
  },
  controller: ['$q', '$scope',
    'colorService', 'TabulationService', 'settingsService', 'socket', 'timeService',
    'heatService', 'riderService', 'headerService',
    function($q, $scope,
             colorService, TabulationService, settingsService, socket, timeService,
             heatService, riderService) {
      var ctrl = this;

      var showAllScores = ctrl.user && ctrl.isAdmin;
      var showOnlyCompletedScores = !showAllScores;

      ctrl.maxScoreCount = 3;
      ctrl.enableLeftRightRule = settingsService.isLeftRightRuleEnabled();

      ctrl.heat = {};
      ctrl.judges = [];

      var allRiders = [];
      var scoresPerRider = {};

      ctrl.tableScoresPerRider = {};
      ctrl.highestTableScoresPerRider = {};

      var totalScoresPerRider = {};

      ctrl.overallResults = [];
      ctrl.scoresNeeded = {};

      var updateSettings = function() {
        settingsService.getSettingsPromise().then(function(response) {
          if(response.status == 200) {
            ctrl.maxScoreCount = response.data.defaultWaveCount;
            ctrl.enableLeftRightRule = response.data.enableLeftRightRule;
          }
        });
      };
      updateSettings();

      var determineScoreNeeded = function(riderId) {
        return TabulationService.determineScoreNeeded(ctrl.highestTableScoresPerRider,
          totalScoresPerRider, riderId, ctrl.maxScoreCount, ctrl.enableLeftRightRule);
      };

      var processScoresIntoResults = function(heat) {
        ctrl.highestTableScoresPerRider = TabulationService.getHighestTableScoresPerRider(ctrl.tableScoresPerRider, ctrl.maxScoreCount, ctrl.enableLeftRightRule);
        totalScoresPerRider = TabulationService.getTotalScorePerRider(ctrl.highestTableScoresPerRider);
        ctrl.overallResults = TabulationService.getOverallResults(totalScoresPerRider, heat.riders);

        ctrl.scoresNeeded = _.transform(heat.riders, function(scoresNeededPerRider, heatRider) {
          var riderId = heatRider.rider._id;
          var scoreNeeded = determineScoreNeeded(riderId);

          scoresNeededPerRider[riderId] = scoreNeeded;

          return scoresNeededPerRider;
        }, {});

        TabulationService.markHighestTableScores(ctrl.tableScoresPerRider, ctrl.highestTableScoresPerRider);
        TabulationService.markIgnoredTableScores(ctrl.tableScoresPerRider, ctrl.highestTableScoresPerRider);
      };

      var processHeat = function(heat) {
        ctrl.judges = TabulationService.findJudges(heat.scores);
        scoresPerRider = TabulationService.createScoresPerRiderMap(heat.scores);
        ctrl.tableScoresPerRider = TabulationService.createTableScoresPerRiderMap(scoresPerRider, ctrl.judges, showOnlyCompletedScores);
        ctrl.rawTableScoresPerRider = TabulationService.createTableScoresPerRiderMap(scoresPerRider, ctrl.judges, !showOnlyCompletedScores);

        processScoresIntoResults(heat);

        ctrl.heat = heat;
      };

      var updateHeatAndRiders = function(heatId) {
        var deferred = $q.defer();

        heatService.getHeat(heatId).then(
          function(response) {
            var heat = response.data;

            riderService.getRidersInDivision(heat.round.division._id).then(
              function(response) {
                allRiders = response.data;

                processHeat(heat);
                deferred.resolve();
              },
              function(response) {
                console.error('Unable to get the riders information for division' + response);
                deferred.reject('Unable to get the riders information for division');
              }
            );

            
          },
          function(response) {
            console.error('Unable to get the desired heat' + response);
            deferred.reject('Unable to get the desired heat');
          }
        );

        return deferred.promise;
      };

      $scope.$on(socket.SOCKET_SCORE_UPDATE_EVENT, function (event, data) {

        if(data.score && data.score.heat == ctrl.heat._id) {
          var existingScore = _.find(ctrl.heat.scores, function(score) {
            return data.score._id == score._id;
          });

          if(existingScore) {
            _.assign(existingScore, data.score);
          }
          else {
            if(!ctrl.heat.scores) {
              console.log('creating empty scores array for the heat');
              ctrl.heat.scores = [];
            }
            ctrl.heat.scores.push(data.score);
          }

          processHeat(ctrl.heat);
        }

      });

      ctrl.timerValue = 'N/A';
      $scope.$on(socket.SOCKET_TIMER_EVENT, function(event, data) {
        if(data.heatId === ctrl.heatId) {
          ctrl.timerValue = timeService.createMinutesSecondsString(data.secondsLeft);
        }
      });

      $scope.$on(socket.SOCKET_SETTINGS_UPDATE_EVENT, function() {
        updateSettings();
        processHeat(ctrl.heat);
      });

      $scope.$on(socket.SOCKET_HEAT_UPDATE_EVENT, function(event, data) {
        if(data.heats) {

          var foundHeat = _.find(data.heats, function(heat) {
            return heat._id == ctrl.heatId;
          });

          if(foundHeat) {
            updateHeatAndRiders(ctrl.heatId);
          }

        }
      });

      ctrl.$onChanges = function(changesObj) {
        if(changesObj.manualRefresh || changesObj.heatId) {
          if(ctrl.heatId) {
            var heatProcessedPromise = updateHeatAndRiders(ctrl.heatId);
            heatProcessedPromise.then(function() {
              ctrl.isInitialLoading = false;
            })
          }
        }
      };

      ctrl.$onInit = function() {
        ctrl.isInitialLoading = true;
      };
    }
  ]
};

module.exports = heatView;