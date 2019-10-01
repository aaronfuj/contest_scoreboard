'use strict';

var _ = require('lodash');

SingleRoundCtrl.$inject = ['$scope', '$http', '$routeParams', 'roundService', 'heatService', 'calculationService', 'headerService', 'settingsService'];

function SingleRoundCtrl($scope, $http, $routeParams, roundService, heatService, calculationService, headerService, settingsService) {

  headerService.updateHeader('Rounds');

  $scope.isLoading = true;

  $scope.round = {};
  $scope.heatName = null;
  $scope.resultsPerHeatId = {};
  $scope.riderRanksPerHeatId = {};

  roundService.getRound($routeParams.id).then(function (response) {
    $scope.round = response.data;

    if ($scope.round.heats) {
      var maxScoreCount = settingsService.getCachedSettings().defaultWaveCount;
      var enableLeftRightRule = settingsService.isLeftRightRuleEnabled();

      var resultsPerHeatId = _.transform($scope.round.heats, function (result, heat) {
        result[heat._id] = calculationService.getOverallResults(
          heat, maxScoreCount, enableLeftRightRule);
      }, {});

      var riderRanksPerHeatId = _.transform($scope.round.heats, function (result, heat) {
        result[heat._id] = calculationService.getCompleteRiderRanks(
          heat, maxScoreCount, enableLeftRightRule);
      }, {});

      _.assign($scope.resultsPerHeatId, resultsPerHeatId);
      _.assign($scope.riderRanksPerHeatId, riderRanksPerHeatId);
    }

    $scope.isLoading = false;
  });

  var createHeat = function (heatName) {
    var heat = {
      name: heatName,
      round: $scope.round._id
    };

    $http.post("/api/heats", heat)
      .success(function (data, status) {
        if ($scope.round.heats === undefined) {
          $scope.round.heats = [];
        }

        $scope.round.heats.push(data);
        $scope.heatName = null;
      })
      .error(function (data) {
        console.log('Error: ' + data);
      });
  };

  $scope.createHeat = createHeat;

  $scope.removeHeat = function (heatId) {
    if (confirm("Are you sure you want to delete this heat?")) {
      heatService.deleteHeat(heatId).then(
        function (response) {
          if (!_.isEmpty($scope.round.heats)) {
            _.remove($scope.round.heats, function (heat) {
              return heat._id == response.data._id;
            });
          }
        },
        function (response) {
          console.error('Unable to delete the heat ' + response);
        }
      );
    }
  };
}

module.exports = SingleRoundCtrl;
