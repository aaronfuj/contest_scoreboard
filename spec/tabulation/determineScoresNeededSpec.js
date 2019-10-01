var _ = require('lodash');
var Tabulation = require('../../public/javascripts/tabulation')();

describe("Tabulation", function() {

  describe("Scores Needed", function() {

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

    function validateScoresNeeded(allTableScoresPerRider, riderId, expectedDifference, expectedScoreCounts, scoresNeeded) {
      var maxCount = 3;
      var highestTableScoresPerRider = Tabulation.getHighestTableScoresPerRider(allTableScoresPerRider, maxCount, true);
      var totalScoresPerRider = Tabulation.getTotalScorePerRider(highestTableScoresPerRider);

      var scoreNeededObject = Tabulation.determineScoreNeeded(
        highestTableScoresPerRider,
        totalScoresPerRider,
        riderId,
        maxCount,
        true);

      //console.log(JSON.stringify(scoreNeededObject, null, 2));

      expect(scoreNeededObject.value).toEqual(expectedDifference);
      expect(scoreNeededObject.minimumScoresNeeded.length).toEqual(expectedScoreCounts);

      if(expectedScoreCounts > 0) {
        _.forEach(scoresNeeded, function(scoreNeeded) {

          //console.log(JSON.stringify(scoreNeededObject.minimumScoresNeeded, null, 2));

          var foundMatch = _.find(scoreNeededObject.minimumScoresNeeded, function(minimumScoreObject) {
            return minimumScoreObject.value == scoreNeeded.value &&
              minimumScoreObject.direction == scoreNeeded.direction;
          });

          expect(foundMatch).toBeDefined();
        })
      }
    }

    it("Should determine score needed", function() {
      var allTableScoresPerRider = {
        'id1': [
          createTableScore(1, 'left', 6),
          createTableScore(2, 'left', 4),
          createTableScore(3, 'right', 3)
        ],
        'id2': [
          createTableScore(1, 'left', 4),
          createTableScore(2, 'left', 4),
          createTableScore(3, 'right', 3)
        ]
      };

      var riderId = 'id2';
      var expectedDifference = 2;
      var expectedScoreCounts = 2;
      var scoresNeeded = [
        { value: 6, direction: 'left'},
        { value: 5, direction: 'right'}
      ];

      validateScoresNeeded(allTableScoresPerRider, riderId, expectedDifference, expectedScoreCounts, scoresNeeded);
    });

    it("Should determine score needed", function() {
      var allTableScoresPerRider = {
        'id1': [
          createTableScore(1, 'left', 6),
          createTableScore(2, 'left', 4),
          createTableScore(3, 'right', 3)
        ],
        'id2': [
          createTableScore(1, 'left', 4),
          createTableScore(2, 'left', 4),
          createTableScore(3, 'left', 3),
          createTableScore(4, 'right', 3),
          createTableScore(5, 'right', 3),
          createTableScore(6, 'right', 3),
          createTableScore(7, 'right', 3)
        ]
      };

      var riderId = 'id2';
      var expectedDifference = 2;
      var expectedScoreCounts = 2;
      var scoresNeeded = [
        { value: 6, direction: 'left'},
        { value: 5, direction: 'right'}
      ];

      validateScoresNeeded(allTableScoresPerRider, riderId, expectedDifference, expectedScoreCounts, scoresNeeded);
    });

    it("Should determine partials", function() {
      var allTableScoresPerRider = {
        'id1': [
          createTableScore(1, 'left', 6),
          createTableScore(2, 'left', 4),
          createTableScore(3, 'right', 3)
        ],
        'id2': [
          createTableScore(1, 'left', 4),
          createTableScore(2, 'left', 4)
        ]
      };

      var riderId = 'id2';
      var expectedDifference = 5;
      var expectedScoreCounts = 2;
      var scoresNeeded = [
        { value: 9, direction: 'left'},
        { value: 5, direction: 'right'}
      ];

      validateScoresNeeded(allTableScoresPerRider, riderId, expectedDifference, expectedScoreCounts, scoresNeeded);
    });

    it("Should determine partials 2", function() {
      var allTableScoresPerRider = {
        'id1': [
          createTableScore(1, 'left', 6),
          createTableScore(2, 'left', 4),
          createTableScore(3, 'right', 3)
        ],
        'id2': [
          createTableScore(1, 'left', 4)
        ]
      };

      var riderId = 'id2';
      var expectedDifference = 9;
      var expectedScoreCounts = 2;
      var scoresNeeded = [
        { value: 9, direction: 'left'},
        { value: 9, direction: 'right'}
      ];

      validateScoresNeeded(allTableScoresPerRider, riderId, expectedDifference, expectedScoreCounts, scoresNeeded);
    });

    it("Should determine one direction", function() {
      var allTableScoresPerRider = {
        'id1': [
          createTableScore(1, 'left', 10),
          createTableScore(2, 'left', 10),
          createTableScore(3, 'right', 3)
        ],
        'id2': [
          createTableScore(1, 'left', 10),
          createTableScore(2, 'left', 10),
          createTableScore(3, 'left', 4)
        ]
      };

      var riderId = 'id2';
      var expectedDifference = 3;
      var expectedScoreCounts = 1;
      var scoresNeeded = [
        { value: 3, direction: 'right'}
      ];

      validateScoresNeeded(allTableScoresPerRider, riderId, expectedDifference, expectedScoreCounts, scoresNeeded);
    });

    it("Should determine one direction 2", function() {
      var allTableScoresPerRider = {
        'id1': [
          createTableScore(1, 'left', 10),
          createTableScore(2, 'left', 10),
          createTableScore(3, 'right', 3)
        ],
        'id2': [
          createTableScore(1, 'left', 10),
          createTableScore(2, 'left', 9)
        ]
      };

      var riderId = 'id2';
      var expectedDifference = 4;
      var expectedScoreCounts = 1;
      var scoresNeeded = [
        { value: 4, direction: 'right'}
      ];

      validateScoresNeeded(allTableScoresPerRider, riderId, expectedDifference, expectedScoreCounts, scoresNeeded);
    });

    it("Should determine one direction 3", function() {
      var allTableScoresPerRider = {
        'id1': [
          createTableScore(1, 'left', 10),
          createTableScore(2, 'left', 10),
          createTableScore(3, 'right', 3)
        ],
        'id2': [
          createTableScore(1, 'left', 10),
          createTableScore(2, 'left', 9),
          createTableScore(3, 'right', 1)
        ]
      };

      var riderId = 'id2';
      var expectedDifference = 3;
      var expectedScoreCounts = 1;
      var scoresNeeded = [
        { value: 4, direction: 'right'}
      ];

      validateScoresNeeded(allTableScoresPerRider, riderId, expectedDifference, expectedScoreCounts, scoresNeeded);
    });

    it("Should be unable to determine", function() {
      var allTableScoresPerRider = {
        'id1': [
          createTableScore(1, 'left', 6),
          createTableScore(2, 'left', 4),
          createTableScore(3, 'right', 3)
        ],
        'id2': [
        ]
      };

      var riderId = 'id2';
      var expectedDifference = 13;
      var expectedScoreCounts = 0;
      var scoresNeeded = [
      ];

      validateScoresNeeded(allTableScoresPerRider, riderId, expectedDifference, expectedScoreCounts, scoresNeeded);
    });
  });
});
