'use strict';

SingleHeatCtrl.$inject = ['$scope', '$routeParams', '$q', '$interval', 'contestorderService', 'settingsService', 'socket', 'heatService', 'headerService'];
function SingleHeatCtrl($scope, $routeParams, $q, $interval, contestorderService, settingsService, socket, heatService, headerService) {
  headerService.updateHeader('Heat Results');

  var heatId = $routeParams.id;

  $scope.manualRefresh = 0;

  $scope.heatId = heatId;
  $scope.heat = {};
  $scope.previousHeat = {};
  $scope.nextHeat = {};

  /** Management code to auto refresh this page and clean it up when the page
   * is destroyed
   */
  $scope.$on("$destroy", function() {
    if (autoRefreshInterval) {
      $interval.cancel(autoRefreshInterval);
    }
  });

  var autoRefreshInterval = undefined;

  var updateSettings = function() {
    settingsService.getSettingsPromise().then(function(response) {
      if(response.status == 200) {
        $scope.maxScoreCount = response.data.defaultWaveCount;
        $scope.enableLeftRightRule = response.data.enableLeftRightRule;
      }
    });
  };
  updateSettings();

  var updateHeatAndRiders = function(heatId) {
    $q.all([heatService.getHeat(heatId), contestorderService.getActiveHeatAndSiblings(heatId)]).then(
      function(httpResults) {
        var heat = httpResults[0].data;
        var heatWithSiblings = httpResults[1].data;
        $scope.heat = heat;
        $scope.previousHeat = heatWithSiblings.previousHeat;
        $scope.nextHeat = heatWithSiblings.nextHeat;
      },
      function(response) {
        console.error('Unable to get the desired heat or active heat and siblings', JSON.stringify(response));
      }
    );
  };
  updateHeatAndRiders(heatId);

  var processHeat = function() {
    $scope.manualRefresh = ($scope.manualRefresh + 1) % 2;
  };

  $scope.onRidersUpdated = function(newRiders) {
    console.log(newRiders);
    processHeat();
  };

  $scope.$on(socket.SOCKET_SETTINGS_UPDATE_EVENT, function() {
    updateSettings();
    processHeat();
  });

  // Setup the manual refreshes for the page
  autoRefreshInterval = $interval(function() {
    $scope.manualRefresh = ($scope.manualRefresh + 1) % 2;
  }, 10000);
}

module.exports = SingleHeatCtrl;
