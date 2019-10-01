'use strict';

var _ = require('lodash');

DivisionsCtrl.$inject = ['$scope', 'divisionService', 'heatService', 'settingsService', 'calculationService', 'headerService'];

function DivisionsCtrl($scope, divisionService, heatService, settingsService, calculationService, headerService) {

  headerService.updateHeader('Divisions / Results');

  $scope.isLoading = true;
  $scope.heats = [];
  $scope.divisions = [];
  $scope.resultsPerHeatId = {};
  $scope.riderRanksPerHeatId = {};

  divisionService.getAllDivisions().then(
    function(response) {
      $scope.divisions = response.data;

      $scope.divisions = _.orderBy($scope.divisions, ['_id'], ['desc']);

      settingsService.getSettingsPromise().then(
        function() {

          heatService.getFinalHeats().then(
            function(response) {
              var heats = response.data;

              var maxScoreCount = settingsService.getCachedSettings().defaultWaveCount;
              var enableLeftRightRule = settingsService.isLeftRightRuleEnabled();

              var resultsPerHeatId = _.transform(heats, function (result, heat) {
                result[heat._id] = calculationService.getOverallResults(
                  heat, maxScoreCount, enableLeftRightRule);
              }, {});

              var riderRanksPerHeatId = _.transform(heats, function (result, heat) {
                result[heat._id] = calculationService.getCompleteRiderRanks(
                  heat, maxScoreCount, enableLeftRightRule);
              }, {});

              _.assign($scope.resultsPerHeatId, resultsPerHeatId);
              _.assign($scope.riderRanksPerHeatId, riderRanksPerHeatId);

              $scope.heats = heats;

              $scope.isLoading = false;
            }
          );
        }
      );
    }
  );

  $scope.getHeats = function(divisionId) {
    var foundHeats = _.filter($scope.heats, function(heat) {
      return heat.round.division._id == divisionId;
    });

    return foundHeats;
  };

  $scope.deleteDivision = function(division) {
    if(confirm("Are you sure you want to delete division " + division.name)) {
      divisionService.deleteDivision(division._id).then(
        function(response) {
          if($scope.divisions) {
            var foundIndex = _.findIndex($scope.divisions, function(currentDivision) {
              return response.data._id == currentDivision._id;
            });

            if(foundIndex != -1) {
              $scope.divisions.splice(foundIndex, 1);
            }
          }
        },
        function(response) {
          console.error(response);
        }
      )
    }
  };

  $scope.onDivisionsAdded = function(newDivisions) {
    if(newDivisions && newDivisions.length > 0) {
      if (!$scope.divisions) {
        $scope.divisions = [];
      }

      _.forEach(newDivisions, function(division) {
        $scope.divisions.push(division);
      });
    }
  };
}

module.exports = DivisionsCtrl;