'use strict';

scoreService.$inject = ['$http'];

function scoreService($http) {

  var createScore = function (userId, heatId, riderId, scoreValue, requestedWaveNumber, direction, isInterference, interferenceType) {
    var scoreData = {
      judge: userId,
      heat: heatId,
      rider: riderId,
      time: Date.now(),
      direction: direction,
      waveNumber: requestedWaveNumber,
      value: scoreValue,
      isInterference: isInterference,
      interferenceType: interferenceType
    };

    return $http.post("/api/scores", scoreData);
  };

  var getScore = function (scoreId) {
    return $http.get('/api/scores/' + scoreId);
  };

  var getScoresForActiveHeats = function () {
    return $http.get('/api/scores/current');
  };

  var deleteScore = function (scoreId) {
    return $http.delete('/api/scores/' + scoreId);
  };

  var updateScore = function (scoreId, riderId, waveNumber, direction, isInterference, interferenceType, value) {
    var updatedFields = {
      rider: riderId,
      waveNumber: waveNumber,
      direction: direction,
      isInterference: isInterference,
      interferenceType: interferenceType,
      value: value
    };
    return $http.put('/api/scores/' + scoreId, updatedFields);
  };

  return {
    createScore: createScore,
    getScore: getScore,
    getScoresForActiveHeats: getScoresForActiveHeats,
    deleteScore: deleteScore,
    updateScore: updateScore
  };
}

module.exports = scoreService;