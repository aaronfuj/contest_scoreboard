'use strict';

roundService.$inject = ['$http'];

function roundService($http) {

  var getRound = function (roundId) {
    return $http.get('/api/rounds/' + roundId);
  };

  var createRound = function (divisionId, roundName) {
    var round = {
      name: roundName,
      division: divisionId
    };

    return $http.post('/api/rounds', round);
  };

  var deleteRound = function (roundId) {
    return $http.delete("/api/rounds/" + roundId);
  };

  return {
    getRound: getRound,
    createRound: createRound,
    deleteRound: deleteRound
  };

}

module.exports = roundService;