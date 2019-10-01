'use strict';

var _ = require('lodash');

ActiveHeatsCtrl.$inject = ['$scope', 'heatService', 'headerService'];

function ActiveHeatsCtrl($scope, heatService, headerService) {

  headerService.updateHeader('Change Heats');

  $scope.heats = [];
  $scope.allHeats = [];
  $scope.selectedHeat = {};

  var getAndStoreActiveHeats = function () {
    heatService.getAllHeats().then(
      function (response) {
        $scope.allHeats = response.data;

        $scope.allHeats = _.forEach($scope.allHeats, function(heat) {
          heat.formattedName = heat.round.division.name + ' - ' + heat.round.name + ' - ' + heat.name;
        });
        $scope.heats = _.transform($scope.allHeats, function (result, heat) {
          if (heat.isActive) {
            result.push(heat);
          }
          return result;
        }, []);
      },
      function (response) {
        console.error("Unable to get all heats " + response);
      }
    );
  };
  getAndStoreActiveHeats();

  $scope.addHeat = function (selectedHeat) {
    var heatId = selectedHeat._id;
    heatService.activateHeat(heatId).then(
      function (response) {
        getAndStoreActiveHeats();
      },
      function (response) {
        console.error("Unable to activate heat " + response);
      }
    );
  };

  $scope.remove = function (heatId) {
    heatService.deactivateHeat(heatId).then(
      function (response) {
        getAndStoreActiveHeats();
      },
      function (response) {
        console.error("Unable to deactivate heat " + response);
      }
    );
  };
}

module.exports = ActiveHeatsCtrl;
