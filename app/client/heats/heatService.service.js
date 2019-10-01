'use strict';

heatService.$inject = ['$http'];

function heatService($http) {

  var getAllHeats = function () {
    return $http.get('/api/heats');
  };

  var getFinalHeats = function() {
    return $http.get('/api/heats/finals');
  };

  var getHeat = function (heatId) {
    return $http.get('/api/heats/' + heatId);
  };

  var deleteHeat = function (heatId) {
    return $http.delete('/api/heats/' + heatId);
  };

  var getActiveHeats = function () {
    return $http.get('/api/activeheats');
  };

  var activateHeat = function (heatId) {
    return $http.post('/api/activeheats/' + heatId);
  };

  var deactivateHeat = function (heatId) {
    return $http.delete('/api/activeheats/' + heatId);
  };

  var addRiderToHeat = function (heatId, riderId, colorValue) {
    var newRider = {
      rider: riderId,
      color: colorValue
    };

    return $http.put('/api/heats/' + heatId + '/addrider', newRider);
  };

  var removeRiderFromHeat = function (heatId, heatRiderId) {
    return $http.delete('/api/heats/' + heatId + '/' + heatRiderId);
  };

  return {
    getAllHeats: getAllHeats,
    getFinalHeats: getFinalHeats,
    getHeat: getHeat,
    deleteHeat: deleteHeat,

    getActiveHeats: getActiveHeats,
    activateHeat: activateHeat,
    deactivateHeat: deactivateHeat,

    addRiderToHeat: addRiderToHeat,
    removeRiderFromHeat: removeRiderFromHeat
  };
}

module.exports = heatService;