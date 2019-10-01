'use strict';

contestorderService.$inject = ['$http'];

function contestorderService($http) {

  var getContestOrder = function () {
    return $http.get('/api/contestorder');
  };

  var updateContestOrder = function (newRounds) {
    var contestOrder = {
      rounds: newRounds
    };
    return $http.put('/api/contestorder/', contestOrder);
  };

  var getActiveHeatAndSiblings = function (heatId) {
    return $http.get('/api/contestorder/heat/' + heatId);
  };

  return {
    getContestOrder: getContestOrder,
    updateContestOrder: updateContestOrder,

    getActiveHeatAndSiblings: getActiveHeatAndSiblings
  };

}

module.exports = contestorderService;