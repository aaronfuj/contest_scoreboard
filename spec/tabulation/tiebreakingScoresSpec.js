var _ = require('lodash');
var Tabulation = require('../../public/javascripts/tabulation')();

describe("Tabulation", function() {

  describe("Tiebreaking Score Selection", function() {

    function createTableScore(waveNumber, direction, scoreValue) {
      return {
        waveNumber: waveNumber,
        judgeScores: [],
        total: scoreValue,
        average: scoreValue,
        adjustedTotal: scoreValue,
        adjustedAverage: scoreValue,
        direction: direction,
        isInterference: false
      };
    }

    it("Should get highest table scores", function() {
      var MAX_COUNT = 3;

      var heatRiders = [
        { rider: { _id: 'id1'} },
        { rider: { _id: 'id2'} },
        { rider: { _id: 'id3'} }
      ];
      var allTableScoresPerRider = {
        'id1': [
          createTableScore(1, 'left', 10),
          createTableScore(2, 'left', 10),
          createTableScore(3, 'right', 10)
        ],
        'id2': [
          createTableScore(1, 'left', 6),
          createTableScore(2, 'left', 5),
          createTableScore(3, 'right', 3),
          createTableScore(4, 'right', 2)
        ],
        'id3': [
          createTableScore(1, 'left', 6),
          createTableScore(2, 'left', 5),
          createTableScore(3, 'right', 3),
          createTableScore(4, 'right', 1)
        ]
      };

      var originalHighestTableScoresPerRider = Tabulation.getHighestTableScoresPerRider(allTableScoresPerRider, MAX_COUNT, true);

      var highestTableScoresPerRider = Tabulation.getTiebreakingHighestTableScoresPerRider(
        heatRiders,
        allTableScoresPerRider,
        originalHighestTableScoresPerRider,
        MAX_COUNT,
        4);
    });

  });
});
