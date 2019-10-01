'use strict';

SettingsCtrl.$inject = ['$scope', '$timeout', 'settingsService', 'headerService'];

function SettingsCtrl($scope, $timeout, settingsService, headerService) {

    headerService.updateHeader('Settings');

    $scope.waveCount = 3;
    $scope.enableLeftRightRule = true;
    $scope.scoreWindowSeconds = 30;
    $scope.maxWaveCount = -1;

    var setScopeSettings = function(settingsObject) {
      $scope.waveCount = settingsObject.defaultWaveCount;
      $scope.enableLeftRightRule = settingsObject.enableLeftRightRule;
      $scope.scoreWindowSeconds = settingsObject.waveWindowSeconds;
      $scope.maxWaveCount = settingsObject.maxWaveCount;
    };

    var showSaved = function () {
      $scope.message = 'Saved';

      $timeout(function () {
        $scope.message = undefined;
      }, 1250);
    };

    settingsService.getSettingsPromise().then(
      function(response) {
        if(response.status && response.status == 200 && response.data) {
          setScopeSettings(response.data);
        }
      },
      function(error) {
        console.error("Unable to get the settings from the server");
      });

    $scope.updateSettings = function() {
      var settingsRequest = {
        defaultWaveCount: $scope.waveCount,
        enableLeftRightRule: $scope.enableLeftRightRule,
        waveWindowSeconds: $scope.scoreWindowSeconds,
        maxWaveCount: $scope.maxWaveCount
      };

      settingsService.setSettings(settingsRequest).then(
        function(response) {
          setScopeSettings(response.data);
          showSaved();
        },
        function(response) {
          console.error(response);
        }
      );
    };
}

module.exports = SettingsCtrl;
