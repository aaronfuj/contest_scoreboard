'use strict';

var _ = require('lodash');

ContestOrderCtrl.$inject = ['$scope', '$q', 'socket', 'heatService', 'roundService', 'contestorderService', 'headerService'];

function ContestOrderCtrl($scope, $q, socket, heatService, roundService, contestorderService, headerService) {

  headerService.updateHeader('Contest Round/Heat Order');

  $scope.isInitialLoading = true;
  $scope.activeRoundIds = [];
  $scope.allRounds = [];
  $scope.allHeats = [];
  $scope.activeRoundToHeats = {};

  $scope.viewableRound = {};
  $scope.viewableHeats = [];

  $scope.activeHeatsWithSiblings = [];

  var getAndStoreRounds = function() {
    return contestorderService.getContestOrder().then(
      function (response) {
        $scope.allRounds = response.data.rounds;
      },
      function (response) {
        console.error("Unable to get all rounds " + response);
      }
    )
  };

  var getAndStoreActiveRoundIds = function () {
    return heatService.getAllHeats().then(
      function (response) {
        $scope.allHeats = response.data;
        $scope.activeRoundIds = _.transform($scope.allHeats, function (result, heat) {
          if (heat.isActive) {
            result.push(heat.round._id);

            contestorderService.getActiveHeatAndSiblings(heat._id).then(
              function(response) {
                $scope.activeHeatsWithSiblings.push(response.data);
              }
            );

            roundService.getRound(heat.round._id).then(
              function(response) {
                $scope.activeRoundToHeats[heat.round._id] = {
                  round: heat.round,
                  heatsInRound: response.data.heats
                };
              }
            );
          }
          return result;
        }, []);
      },
      function (response) {
        console.error("Unable to get all heats " + response);
      }
    );
  };

  var selectRound = function(roundId) {
    $scope.viewableRound = _.find($scope.allRounds, function(round) {
      return round._id == roundId;
    });

    if($scope.viewableRound) {
      $scope.viewableRound.heatsAreViewable = !$scope.viewableRound.heatsAreViewable;
    }

    $scope.viewableHeats = _.reduce($scope.allHeats, function(result, heat) {
      if(heat.round._id == roundId) {
        result.push(heat);
      }
      return result;
    }, []);
  };

  $scope.selectRound = selectRound;

  var initializePage = function() {
    $scope.isInitialLoading = true;
    $scope.activeRoundIds = [];
    $scope.allRounds = [];
    $scope.allHeats = [];
    $scope.activeRoundToHeats = {};

    $scope.viewableRound = {};
    $scope.viewableHeats = [];

    $scope.activeHeatsWithSiblings = [];

    $q.all([getAndStoreActiveRoundIds(), getAndStoreRounds()]).then(
      function(success) {

        // Get the last round and select it
        var round = _.findLast($scope.allRounds, function(searchRound) {
          return _.indexOf($scope.activeRoundIds, searchRound._id) != -1;
        });

        if(round) {
          selectRound(round._id);
        }

        $scope.isInitialLoading = false;
      },
      function(failure) {
        console.error(failure);
        $scope.isInitialLoading = false;
      }
    )
  };

  initializePage();

  // var getHeatWithSiblings = function(heatId) {
  //   contestorderService.getActiveHeatAndSiblings(heatId).then(
  //     function(response) {
  //       $scope.activeHeatsWithSiblings = [];
  //       $scope.activeHeatsWithSiblings.push(response.data);
  //     }
  //   )
  // };
  //
  // $scope.setHeat = getHeatWithSiblings;

  var getHeatsForRoundId = function(roundId) {
    if($scope.allHeats) {
      var heatsInRound = _.filter($scope.allHeats, function(heat) {
        return roundId == heat.round._id;
      });
      return heatsInRound;
    }
    else {
      return [];
    }
  };

  $scope.getHeatsForRoundId = getHeatsForRoundId;


  var disableHeatAndEnableHeat = function(heatIdToDisable, heatIdToEnable) {

    // Get confirmation before proceeding
    if (confirm("Are you sure you want to end this heat and start a different heat?")) {
      var deactivatePromise = heatService.deactivateHeat(heatIdToDisable);
      var activatePromise = heatService.activateHeat(heatIdToEnable);

      $q.all([deactivatePromise, activatePromise]).then(
        function(responses) {
          initializePage();
        }
      )
    }
  };

  $scope.disableHeatAndEnableHeat = disableHeatAndEnableHeat;

  $scope.displayHeatString = function(fullHeat) {
    if(fullHeat) {
      return fullHeat.round.division.name + " - " + fullHeat.round.name + " - " + fullHeat.name;
    }
    else {
      return "N/A";
    }
  };

  $scope.displayHeatCount = function(roundId) {
    var heatCount = getHeatsForRoundId(roundId).length;

    if(heatCount) {
      if(heatCount > 1) {
        return heatCount + " heats";
      }
      else {
        return "1 heat";
      }
    }
    else {
      return "";
    }
  };

  $scope.isActiveRound = function(roundId) {
    return _.indexOf($scope.activeRoundIds, roundId) != -1;
  };

  // $scope.$on(socket.SOCKET_HEAT_UPDATE_EVENT, function () {
  //   initializePage();
  // });
}

module.exports = ContestOrderCtrl;
