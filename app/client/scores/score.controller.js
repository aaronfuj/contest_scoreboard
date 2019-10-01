'use strict';

var _ = require('lodash');

ScoreCtrl.$inject = ['$scope', '$routeParams', '$window', 'scoreService', 'heatService'];

function ScoreCtrl($scope, $routeParams, $window, scoreService, heatService) {

  $scope.score = null;
  $scope.selectedRider = null;
  $scope.heatRiders = [];

  var scoreId = $routeParams.id;

  scoreService.getScore(scoreId).then(
    function (response) {
      $scope.score = response.data;

      var heatId = $scope.score.heat._id;
      heatService.getHeat(heatId).then(
        function (response) {
          var heat = response.data;

          if (heat) {
            $scope.heatRiders = heat.riders;
            console.log(heat.riders);

            // Set the selected rider
            $scope.selectedRider = _.find(heat.riders, function (rider) {
              return rider.rider._id == $scope.score.rider._id;
            });

            if ($scope.selectedRider) {
              $scope.score.rider.color = $scope.selectedRider.color;
            }
          }
        }
      )
    },
    function (response) {
      console.error('Unable to get info on the score ' + response);
    }
  );

  $scope.back = function () {
    $window.history.back();
  };

  $scope.delete = function () {
    if ($window.confirm("Are you sure you want to delete this score?")) {
      scoreService.deleteScore(scoreId).then(
        function (response) {
          $scope.score = null;
          $window.alert("Score deleted");
          $scope.back();
        },
        function (response) {
          console.error('Unable to delete the score ' + response);
        }
      );
    }
  };

  $scope.updateScore = function (riderId, waveNumber, direction, isInterference, interferenceType, scoreValue) {
    scoreService.updateScore(scoreId, riderId, waveNumber, direction, isInterference, interferenceType, scoreValue).then(
      function (response) {
        $scope.score = response.data;
        $window.alert("Score updated");
        $scope.back();
      },
      function (response) {
        console.error('Unable to update score ' + response);
      }
    );
  };
}

module.exports = ScoreCtrl;