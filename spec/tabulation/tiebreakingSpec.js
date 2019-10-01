var _ = require('lodash');
var Tabulation = require('../../public/javascripts/tabulation')();

describe("Tabulation", function() {

  describe("Tiebreaking", function() {

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

    function testExpectedTiebreakAll(maxCount, allTableScoresPerRider, heatRiders, expectedRanks, tieExpected) {

      var originalHighestTableScoresPerRider = Tabulation.getHighestTableScoresPerRider(allTableScoresPerRider, maxCount, true);
      var currentHighTableScoresPerRider = originalHighestTableScoresPerRider;
      var previousMaxCount = maxCount;

      var results = Tabulation.getResultsAfterTiebreak(
        allTableScoresPerRider,
        originalHighestTableScoresPerRider,
        currentHighTableScoresPerRider,
        maxCount,
        heatRiders,
        previousMaxCount);

      validateResults(results, expectedRanks, tieExpected);

      var completedResults = Tabulation.getCompleteRiderRanks(allTableScoresPerRider, maxCount, true, heatRiders);

      validateResults(completedResults, expectedRanks, tieExpected);
    }

    function validateResults(results, expectedRanks, tieExpected) {
      if(!tieExpected) {
        expect(results.tiedRiders.length).toEqual(0);
      }

      // Check the overall ranks
      _.forEach(expectedRanks, function(expectedRank) {
        expect(results.riderIdToRank[expectedRank.id]).toEqual(expectedRank.rank);
      });
    }

    it("Should do multiple layers", function() {
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
          createTableScore(1, 'left', 5),
          createTableScore(2, 'left', 4),
          createTableScore(3, 'right', 4)
        ],
        'id3': [
          createTableScore(1, 'left', 6),
          createTableScore(2, 'left', 5),
          createTableScore(3, 'right', 3)
        ]
      };

      var expectedRanks = [
        { id: 'id1', rank: 1},
        { id: 'id2', rank: 3},
        { id: 'id3', rank: 2}
      ];

      testExpectedTiebreakAll(MAX_COUNT, allTableScoresPerRider, heatRiders, expectedRanks);
    });

    it("Should do multiple layers 2", function() {
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

      var expectedRanks = [
        { id: 'id1', rank: 1},
        { id: 'id2', rank: 2},
        { id: 'id3', rank: 3}
      ];

      testExpectedTiebreakAll(MAX_COUNT, allTableScoresPerRider, heatRiders, expectedRanks);
    });

    it("Should test results with no tie", function() {
      var MAX_COUNT = 3;
      var allTableScoresPerRider = {
        'id1': [
          createTableScore(1, 'left', 4)
        ],
        'id2': [
          createTableScore(1, 'left', 5)
        ]
      };
      var heatRiders = [
        { rider: { _id: 'id1'} },
        { rider: { _id: 'id2'} }
      ];
      var expectedRanks = [
        { id: 'id1', rank: 2},
        { id: 'id2', rank: 1}
      ];

      testExpectedTiebreakAll(MAX_COUNT, allTableScoresPerRider, heatRiders, expectedRanks);
    });

    it("Should test simple tie break for one pass", function() {
      var MAX_COUNT = 3;
      var allTableScoresPerRider = {
        'id1': [
          createTableScore(1, 'left', 5),
          createTableScore(2, 'left', 4),
          createTableScore(3, 'right', 4)
        ],
        'id2': [
          createTableScore(1, 'left', 6),
          createTableScore(2, 'left', 4),
          createTableScore(3, 'right', 3)
        ]
      };
      var heatRiders = [
        { rider: { _id: 'id1'} },
        { rider: { _id: 'id2'} }
      ];
      var expectedRanks = [
        { id: 'id1', rank: 2},
        { id: 'id2', rank: 1}
      ];

      testExpectedTiebreakAll(MAX_COUNT, allTableScoresPerRider, heatRiders, expectedRanks);
    });

    it("Can't break tie when not enough scores found", function() {
      var MAX_COUNT = 3;
      var allTableScoresPerRider = {
        'id1': [
          createTableScore(1, 'left', 5),
          createTableScore(2, 'left', 5),
          createTableScore(3, 'right', 5)
        ],
        'id2': [
          createTableScore(1, 'left', 5),
          createTableScore(2, 'left', 5),
          createTableScore(3, 'right', 5)
        ]
      };
      var heatRiders = [
        { rider: { _id: 'id1'} },
        { rider: { _id: 'id2'} }
      ];
      var expectedRanks = [
        { id: 'id1', rank: 1},
        { id: 'id2', rank: 1}
      ];

      testExpectedTiebreakAll(MAX_COUNT, allTableScoresPerRider, heatRiders, expectedRanks, true);
    });

    it("Should not tie due to left right rule", function() {
      var MAX_COUNT = 3;
      var allTableScoresPerRider = {
        'id1': [
          createTableScore(1, 'left', 5),
          createTableScore(2, 'left', 5),
          createTableScore(3, 'left', 5)
        ],
        'id2': [
          createTableScore(1, 'left', 5),
          createTableScore(2, 'left', 5),
          createTableScore(3, 'right', 5)
        ]
      };
      var heatRiders = [
        { rider: { _id: 'id1'} },
        { rider: { _id: 'id2'} }
      ];
      var expectedRanks = [
        { id: 'id1', rank: 2},
        { id: 'id2', rank: 1}
      ];

      testExpectedTiebreakAll(MAX_COUNT, allTableScoresPerRider, heatRiders, expectedRanks);
    });

    it("Should break two ties", function() {
      var MAX_COUNT = 3;
      var allTableScoresPerRider = {
        'id1': [
          createTableScore(1, 'left', 6),
          createTableScore(2, 'left', 4),
          createTableScore(3, 'right', 3)
        ],
        'id2': [
          createTableScore(1, 'left', 5),
          createTableScore(2, 'left', 4),
          createTableScore(3, 'right', 4)
        ],
        'id3': [
          createTableScore(1, 'left', 9),
          createTableScore(2, 'left', 7),
          createTableScore(3, 'right', 5)
        ],
        'id4': [
          createTableScore(1, 'left', 9),
          createTableScore(2, 'left', 8),
          createTableScore(3, 'right', 4)
        ]
      };
      var heatRiders = [
        { rider: { _id: 'id1'} },
        { rider: { _id: 'id2'} },
        { rider: { _id: 'id3'} },
        { rider: { _id: 'id4'} }
      ];
      var expectedRanks = [
        { id: 'id1', rank: 3},
        { id: 'id2', rank: 4},
        { id: 'id3', rank: 2},
        { id: 'id4', rank: 1}
      ];

      testExpectedTiebreakAll(MAX_COUNT, allTableScoresPerRider, heatRiders, expectedRanks);
    });

    it("Should break one tie", function() {
      var MAX_COUNT = 3;
      var allTableScoresPerRider = {
        'id1': [
          createTableScore(1, 'left', 6),
          createTableScore(2, 'left', 4),
          createTableScore(3, 'right', 3)
        ],
        'id2': [
          createTableScore(1, 'left', 5),
          createTableScore(2, 'left', 4),
          createTableScore(3, 'right', 4)
        ],
        'id3': [
          createTableScore(1, 'left', 9),
          createTableScore(2, 'left', 9),
          createTableScore(3, 'right', 5)
        ],
        'id4': [
          createTableScore(1, 'left', 9),
          createTableScore(2, 'left', 8),
          createTableScore(3, 'right', 4)
        ]
      };
      var heatRiders = [
        { rider: { _id: 'id1'} },
        { rider: { _id: 'id2'} },
        { rider: { _id: 'id3'} },
        { rider: { _id: 'id4'} }
      ];
      var expectedRanks = [
        { id: 'id1', rank: 3},
        { id: 'id2', rank: 4},
        { id: 'id3', rank: 1},
        { id: 'id4', rank: 2}
      ];

      testExpectedTiebreakAll(MAX_COUNT, allTableScoresPerRider, heatRiders, expectedRanks);
    });

    it("Should break a three way tie with multiple stages", function() {
      var MAX_COUNT = 3;
      var allTableScoresPerRider = {
        'id1': [
          createTableScore(1, 'left', 6),
          createTableScore(2, 'left', 4),
          createTableScore(3, 'right', 3)
        ],
        'id2': [
          createTableScore(1, 'left', 5),
          createTableScore(2, 'left', 4),
          createTableScore(3, 'right', 4)
        ],
        'id3': [
          createTableScore(1, 'left', 6),
          createTableScore(2, 'left', 4),
          createTableScore(3, 'right', 3),
          createTableScore(4, 'right', 3)
        ],
        'id4': [
          createTableScore(1, 'left', 9),
          createTableScore(2, 'left', 8),
          createTableScore(3, 'right', 4)
        ]
      };
      var heatRiders = [
        { rider: { _id: 'id1'} },
        { rider: { _id: 'id2'} },
        { rider: { _id: 'id3'} },
        { rider: { _id: 'id4'} }
      ];
      var expectedRanks = [
        { id: 'id1', rank: 3},
        { id: 'id2', rank: 4},
        { id: 'id3', rank: 2},
        { id: 'id4', rank: 1}
      ];

      testExpectedTiebreakAll(MAX_COUNT, allTableScoresPerRider, heatRiders, expectedRanks);
    });

  });
});
