'use strict';

var _ = require('lodash');

RidersCtrl.$inject = ['$scope', '$q', 'riderService', 'divisionService', 'headerService'];

function RidersCtrl($scope, $q, riderService, divisionService, headerService) {

  headerService.updateHeader('Riders');

  $scope.allRiders = [];
  $scope.filteredRiders = [];
  $scope.ridersForDivision = [];
  $scope.divisions = [];
  $scope.bulkRiderNames = "";

  var filterRiders = function (division) {
    var filteredRiders = _.filter($scope.allRiders, function (rider) {
      var riderDivision = _.find(rider.divisions, function (innerDivision) {
        return innerDivision._id == division._id;
      });

      return !!riderDivision;
    });

    return filteredRiders;
  };

  var initializePage = function (selectFirstDivision) {
    riderService.getAllRiders().then(
      function (response) {
        $scope.allRiders = response.data;

        divisionService.getAllDivisions().then(
          function (response) {
            $scope.divisions = response.data;

            if (selectFirstDivision && $scope.divisions && $scope.divisions.length > 0) {
              $scope.selectedDivision = $scope.divisions[0];
            }

            $scope.filteredRiders = filterRiders($scope.selectedDivision);
          }
        );
      }
    );
  };
  initializePage(true);

  $scope.createDivisionString = function (divisionObjects) {
    var divisionString = _.reduce(divisionObjects, function (runningDiv, division) {
      if (runningDiv) {
        runningDiv += ', ' + division.name;
      }
      else {
        runningDiv = division.name;
      }
      return runningDiv;
    }, null);

    return divisionString;
  };

  $scope.removeRider = function (riderId) {
    riderService.deleteRider(riderId).then(
      function () {
        initializePage(false);
      },
      function (response) {
        console.error('Unable to remove rider ' + response);
      }
    );
  };

  $scope.onRidersAdded = function (division, riders) {
    if(riders && riders.length > 0) {
      if (!$scope.allRiders) {
        $scope.allRiders = [];
      }

      _.forEach(riders, function(rider) {
        $scope.allRiders.push(rider);
      });

      $scope.selectDivision(division);
    }
  };

  $scope.selectDivision = function (division) {
    $scope.selectedDivision = division;
    $scope.filteredRiders = filterRiders($scope.selectedDivision);
  };

  $scope.isSelected = function (division) {
    return division._id == $scope.selectedDivision._id;
  };
}

module.exports = RidersCtrl;
