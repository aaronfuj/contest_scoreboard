'use strict';

riderService.$inject = ['$http'];
function riderService($http) {

  var getAllRiders = function () {
    return $http.get('/api/riders');
  };

  var getRidersInDivision = function (divisionId) {
    return $http.get('/api/riders?division=' + divisionId);
  };

  var createRider = function (riderName, divisionId) {
    var rider = {
      name: riderName,
      divisions: [divisionId]
    };

    return $http.post('/api/riders', rider);
  };

  var deleteRider = function (riderId) {
    return $http.delete('/api/riders/' + riderId);
  };

  return {
    getAllRiders: getAllRiders,
    getRidersInDivision: getRidersInDivision,
    createRider: createRider,
    deleteRider: deleteRider
  };
}

module.exports = riderService;