'use strict';

calculationService.$inject = ['TabulationService'];

function calculationService(TabulationService) {

  var getOverallResults = function(heat, maxScoreCount, enableLeftRightRule) {
    var judges = TabulationService.findJudges(heat.scores);
    var scoresPerRider = TabulationService.createScoresPerRiderMap(heat.scores);
    var tableScoresPerRider = TabulationService.createTableScoresPerRiderMap(scoresPerRider, judges, true);

    var highestTableScoresPerRider = TabulationService.getHighestTableScoresPerRider(tableScoresPerRider, maxScoreCount, enableLeftRightRule);
    var totalScoresPerRider = TabulationService.getTotalScorePerRider(highestTableScoresPerRider);
    var overallResults = TabulationService.getOverallResults(totalScoresPerRider, heat.riders);
    return overallResults;
  };

  var getCompleteRiderRanks = function(heat, maxScoreCount, enableLeftRightRule) {
    var judges = TabulationService.findJudges(heat.scores);
    var scoresPerRider = TabulationService.createScoresPerRiderMap(heat.scores);
    var tableScoresPerRider = TabulationService.createTableScoresPerRiderMap(scoresPerRider, judges, true);

    var riderRanks = TabulationService.getCompleteRiderRanks(tableScoresPerRider, maxScoreCount, enableLeftRightRule, heat.riders);
    return riderRanks;
  };

   return {
     getOverallResults : getOverallResults,
     getCompleteRiderRanks : getCompleteRiderRanks,
   };
}

module.exports = calculationService;
