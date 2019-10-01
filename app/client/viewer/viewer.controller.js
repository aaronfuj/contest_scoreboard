'use strict';

var _ = require('lodash');

ViewerCtrl.$inject = ['$scope', '$interval', 'socket', 'heatService', 'contestorderService', 'calculationService', 'settingsService', 'headerService'];

function ViewerCtrl($scope, $interval, socket, heatService, contestorderService, calculationService, settingsService, headerService) {
  headerService.updateHeader('Live Score Tracker');

  $scope.manualRefresh = 0;

  /** Management code to auto refresh this page and clean it up when the page
   * is destroyed
   */
  $scope.$on("$destroy", function() {
    if (autoRefreshInterval) {
      $interval.cancel(autoRefreshInterval);
    }
  });

  var autoRefreshInterval = undefined;

  var initializePage = function() {
    if (autoRefreshInterval) {
      $interval.cancel(autoRefreshInterval);
    }

    // Load in all of the active heats that we will be able to judge
    heatService.getActiveHeats().then(
      function (response) {
        $scope.activeHeats = response.data;

        _.forEach($scope.activeHeats, function(heat) {
          contestorderService.getActiveHeatAndSiblings(heat._id).then(
            function(response) {
              heat.previousHeat = response.data.previousHeat;
              heat.nextHeat = response.data.nextHeat;

              if(heat.previousHeat) {
                heatService.getHeat(heat.previousHeat._id).then(
                  function(previousHeatResponse) {
                    var previousFullHeat = previousHeatResponse.data;
                    var maxScoreCount = settingsService.getCachedSettings().defaultWaveCount;
                    var enableLeftRightRule = settingsService.isLeftRightRuleEnabled();

                    var results = calculationService.getOverallResults(
                      previousFullHeat, maxScoreCount, enableLeftRightRule);

                    var riderRanks = calculationService.getCompleteRiderRanks(
                      previousFullHeat, maxScoreCount, enableLeftRightRule);

                    heat.previousHeat.results = results;
                    heat.previousHeat.riderRanks = riderRanks;
                  },
                  function(response) {
                    console.error("Unable to get data for previous heat " + JSON.stringify(response));
                  }
                )
              }
            },
            function(response) {
              console.error("Unable to get siblings for " + heat._id + ": " + JSON.stringify(response));
            }
          );
        });


        if($scope.activeHeats && $scope.activeHeats.length > 0) {

          // Setup the manual refreshes for the page
          autoRefreshInterval = $interval(function() {
            $scope.manualRefresh = ($scope.manualRefresh + 1) % 2;
          }, 10000);

        }
        else {
          $scope.heat = {};
        }

      },
      function (response) {
        console.log('Error: ' + response);
      }
    );
  };
  initializePage();

  $scope.$on(socket.SOCKET_HEAT_UPDATE_EVENT, function() {
    initializePage();
  });

  $scope.$on(socket.SOCKET_SETTINGS_UPDATE_EVENT, function() {
    initializePage();
  });
}

module.exports = ViewerCtrl;
