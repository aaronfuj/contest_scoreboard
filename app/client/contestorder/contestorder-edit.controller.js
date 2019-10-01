'use strict';

var _ = require('lodash');

ContestOrderEditCtrl.$inject = ['$scope', '$q', '$sce', '$timeout', 'heatService', 'contestorderService', 'headerService'];

function ContestOrderEditCtrl($scope, $q, $sce, $timeout, heatService, contestorderService, headerService) {

  headerService.updateHeader('Edit Contest Round/Heat Order');

  $scope.toast = {
    color: 'black',
    message: null
  };

  $scope.activeRoundIds = [];
  $scope.allRounds = [];
  $scope.allHeats = [];

  $scope.activeHeatsWithSiblings = [];

  var onMove = function() {

  };

  $scope.sortableConf = {
    animation: 350,
    chosenClass: 'sortable-chosen',
    handle: '.grab-handle',
    forceFallback: true,
    onMove: onMove
  };

  var showToast = function (message, color) {
    $scope.hasToast = true;
    $scope.toast.message = $sce.trustAsHtml(message);
    $scope.toast.color = color;

    $timeout(function () {
      $scope.hasToast = false;
      $scope.toast.message = '';
    }, 2500);
  };

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
            )
          }
          return result;
        }, []);
      },
      function (response) {
        console.error("Unable to get all heats " + response);
      }
    );
  };

  var initializePage = function() {
    $q.all([getAndStoreActiveRoundIds(),getAndStoreRounds()]).then(
      function() {},
      function() {}
    );
  };

  initializePage();

  var getHeatWithSiblings = function(heatId) {
    contestorderService.getActiveHeatAndSiblings(heatId).then(
      function(response) {
        $scope.activeHeatsWithSiblings = [];
        $scope.activeHeatsWithSiblings.push(response.data);
      }
    )
  };

  var saveOrder = function() {
    var orderedRoundIds = _.reduce($scope.allRounds, function(result, round) {
      result.push(round._id);
      return result;
    }, []);
    contestorderService.updateContestOrder(orderedRoundIds).then(
      function(response) {
        console.log("Successfully updated order", response);
        showToast('Saved Order', 'green');
      },
      function(response) {
        console.error("Unable to update order", response);
        showToast('Unable to Save Order', 'red');
      }
    );
  };

  $scope.setHeat = getHeatWithSiblings;

  $scope.displayHeatString = function(fullHeat) {
    if(fullHeat) {
      return fullHeat.round.division.name + " - " + fullHeat.round.name + " - " + fullHeat.name;
    }
    else {
      return "N/A";
    }
  };

  $scope.isActiveRound = function(roundId) {
    return _.indexOf($scope.activeRoundIds, roundId) != -1;
  };

  $scope.moveUp = function(roundId) {
    var foundIndex = _.findIndex($scope.allRounds, function(round) {
      return round._id == roundId;
    });

    if(foundIndex > 0) {
      var roundToMove = $scope.allRounds[foundIndex];
      $scope.allRounds.splice(foundIndex, 1);
      $scope.allRounds.splice(foundIndex-1, 0, roundToMove);
    }
  };

  $scope.moveDown = function(roundId) {
    var foundIndex = _.findIndex($scope.allRounds, function(round) {
      return round._id == roundId;
    });

    if(foundIndex < $scope.allRounds.length-1) {
      var roundToMove = $scope.allRounds[foundIndex];
      $scope.allRounds.splice(foundIndex, 1);
      $scope.allRounds.splice(foundIndex+1, 0, roundToMove);
    }
  };

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

  $scope.saveOrder = saveOrder;


  
  
}

module.exports = ContestOrderEditCtrl;
