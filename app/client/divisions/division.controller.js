'use strict';

var _ = require('lodash');

SingleDivisionCtrl.$inject = ['$q', '$scope', '$routeParams', 'divisionService', 'roundService', 'calculationService', 'headerService', 'settingsService'];

function SingleDivisionCtrl($q, $scope, $routeParams, divisionService, roundService, calculationService, headerService, settingsService) {

  headerService.updateHeader('Results');

  $scope.division = {};
  $scope.roundName = null;
  $scope.riderRanksPerHeatId = {};
  $scope.resultsPerHeatId = {};
  $scope.selectedRound = {};

  $scope.isLoading = true;

  divisionService.getDivision($routeParams.id).then(
    function (response) {
      $scope.division = response.data;

      if ($scope.division.rounds) {

        $scope.selectedRound = $scope.division.rounds[0];

        var allRoundsPromises = [];

        _.forEach($scope.division.rounds, function (round) {
          var roundPromise = roundService.getRound(round._id);
          roundPromise.then(
            function (response) {

              if (response.data.heats) {
                round.heats = response.data.heats;

                var maxScoreCount = settingsService.getCachedSettings().defaultWaveCount;
                var enableLeftRightRule = settingsService.isLeftRightRuleEnabled();

                var resultsPerHeatId = _.transform(round.heats, function (result, heat) {
                  result[heat._id] = calculationService.getOverallResults(
                    heat, maxScoreCount, enableLeftRightRule);
                }, {});

                var riderRanksPerHeatId = _.transform(round.heats, function (result, heat) {
                  result[heat._id] = calculationService.getCompleteRiderRanks(
                    heat, maxScoreCount, enableLeftRightRule);
                }, {});

                _.assign($scope.resultsPerHeatId, resultsPerHeatId);
                _.assign($scope.riderRanksPerHeatId, riderRanksPerHeatId)
              }

            },
            function (response) {
              console.error("Unable to get round " + response);
            }
          );

          allRoundsPromises.push(roundPromise);
        });

        if(allRoundsPromises.length > 0) {
          $q.all(allRoundsPromises).then(
            function() {
              $scope.isLoading = false;
            },
            function() {
              $scope.isLoading = false;
            });
        }
        else {
          $scope.isLoading = false;
        }
      }
      else {
        $scope.isLoading = false;
      }
    }
  );

  /**
   * A callback for handling when new rounds have been added
   * @param newRounds a potential array of new rounds which have been added
   */
  $scope.onRoundsAdded = function(newRounds) {
    if(newRounds && newRounds.length > 0) {
      if (!$scope.division.rounds) {
        $scope.division.rounds = [];
      }

      _.forEach(newRounds, function(round) {
        $scope.division.rounds.push(round);
      });
    }
  };

  $scope.removeRound = function (roundId) {
    if (confirm("Are you sure you want to delete this round?")) {
      roundService.deleteRound(roundId).then(
        function (response) {
          if (!_.isEmpty($scope.division.rounds)) {
            _.remove($scope.division.rounds, function (round) {
              return round._id == response.data._id;
            });
          }

          if (_.isEmpty($scope.division.rounds)) {
            $scope.selectedRound = {};
          }
          else {
            $scope.selectedRound = $scope.division.rounds[0];
          }
        },
        function (response) {
          console.error('Unable to delete the round ' + response);
        }
      );
    }
  };

  $scope.selectRound = function (round) {
    $scope.selectedRound = round;
  };

  var selectAdjacentRound = function(offset) {
    if($scope.division.rounds && $scope.division.rounds.length > 0) {
      if($scope.selectedRound) {
        var selectedIndex = _.findIndex($scope.division.rounds, function(round) {
          return $scope.selectedRound._id == round._id;
        });

        if(selectedIndex > -1) {
          var newIndex = selectedIndex + offset;

          if(newIndex >= 0 && newIndex < $scope.division.rounds.length) {
            $scope.selectedRound = $scope.division.rounds[selectedIndex+offset];
          }
        }
        else {
          $scope.selectedRound = $scope.division.rounds[0];
        }
      }
      else {
        $scope.selectedRound = $scope.division.rounds[0];
      }
    }
  };

  $scope.selectPreviousRound = function() {
    selectAdjacentRound(-1);
  };

  $scope.selectNextRound = function() {
    selectAdjacentRound(1);
  };

  $scope.isSelected = function (round) {
    return round._id == $scope.selectedRound._id;
  };
}

module.exports = SingleDivisionCtrl;