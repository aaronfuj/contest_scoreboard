'use strict';

var _ = require('lodash');

var heatDisplay = {
  templateUrl: '/heats/heatDisplay.html',
  bindings: {
    enableLeftRightRule: '<',
    heat: '<',
    maxScoreCount: '<',
    scoresNeeded: '<',
    rawTableScoresPerRider: '<',
    tableScoresPerRider: '<',
    highestTableScoresPerRider: '<',
    overallResults: '<'
  },
  controller: [ 'TabulationService',
    function(TabulationService) {
      var ctrl = this;
      ctrl.HIGH_SCORE_FIELD = TabulationService.HIGH_SCORE_FIELD;
      ctrl.interferences = {};

      ctrl.formatRiderName = function(riderName) {
        return riderName.toUpperCase().split(' ').join('\n');
      };

      ctrl.getRiderRank = function(riderId) {
        var riderRanksObject = TabulationService.getCompleteRiderRanks(ctrl.tableScoresPerRider, ctrl.maxScoreCount, ctrl.enableLeftRightRule, ctrl.heat.riders);
        var rank = riderRanksObject.riderIdToRank[riderId];
        if(_.isNumber(rank)) {
          return rank;
        }
        else {
          return "?";
        }
      };

      ctrl.getTableScoresForRider = function(riderId, direction) {
        var tableScoresForRider = TabulationService.getTableScoresForRiderWithHighScoresDefined(
          riderId, direction, ctrl.tableScoresPerRider, ctrl.highestTableScoresPerRider);

        // Identify the highest score for the rider
        var highestTableScoresForRider = ctrl.highestTableScoresPerRider[riderId];
        if (highestTableScoresForRider) {
          var maxScore = _.maxBy(highestTableScoresForRider, ctrl.HIGH_SCORE_FIELD);

          if (maxScore) {
            var maxValue = maxScore[ctrl.HIGH_SCORE_FIELD];

            // Mark any scores which are higher than the highest table scores as 'ignored' due to interference

            _.forEach(tableScoresForRider, function(tableScore) {
              if (tableScore[ctrl.HIGH_SCORE_FIELD] > maxValue) {
                tableScore.isIgnored = true;
              }
            });
          }
        }

        return tableScoresForRider;
      };

      var getInterferenceScores = function(tableScoresPerRider) {

        var interferences = {};

        _.forEach(tableScoresPerRider, function(tableScoresForRider, riderId) {
          if(tableScoresForRider) {
            var interferenceCount =_.reduce(tableScoresForRider, function(result, tableScore) {
              return result + (tableScore.isInterference ? 1 : 0);
            }, 0);

            if(interferenceCount > 0) {
              var displayString = Array(interferenceCount+1).join("*");
              interferences[riderId] = {
                interferenceCount: interferenceCount,
                displayString: displayString
              }
            }
            else {
              interferences[riderId] = undefined;
            }
          }
        });

        return interferences;
      };

      ctrl.isWinning = function(riderId) {
        var scoreNeeded = ctrl.scoresNeeded[riderId];
        if(!scoreNeeded) {
          return false;
        }

        return scoreNeeded.value <= 0;
      };

      ctrl.isAdvancing = function(riderId) {
        if(ctrl.isWinning(riderId)) {
          return true;
        }

        var scoreNeeded = ctrl.scoresNeeded[riderId];
        if(!scoreNeeded) {
          return false;
        }

        return scoreNeeded.placementScoresNeeded.length === 0;
      };

      var getScoreNeeded = function(riderId, scoresNeededFieldName, direction) {
        var scoreNeeded = ctrl.scoresNeeded[riderId];
        if(!scoreNeeded) {
          return "N/A";
        }

        var foundScoreNeeded = undefined;

        if(direction) {
          foundScoreNeeded = _.find(scoreNeeded[scoresNeededFieldName], function(scoreNeeded) {
            return scoreNeeded.direction == direction;
          });
        }
        else {
          foundScoreNeeded = _.first(scoreNeeded[scoresNeededFieldName]);
        }

        if(foundScoreNeeded) {
          return foundScoreNeeded.value.toFixed(2);
        }
        else {
          return "N/A";
        }
      };

      ctrl.getFirstPlaceScoreNeeded = function(riderId, direction) {
        return getScoreNeeded(riderId, 'minimumScoresNeeded', direction);
      };

      ctrl.getSecondPlaceScoreNeeded = function(riderId, direction) {
        return getScoreNeeded(riderId, 'placementScoresNeeded', direction);
      };

      ctrl.getTotalScoreForRider = function(riderId) {
        var topResults = ctrl.overallResults;
        var foundResult = _.find(topResults, function(topResult) {
          return riderId == topResult.heatRider.rider._id;
        });

        if(foundResult) {
          return foundResult.total;
        }
        else {
          return 'N/A';
        }
      };

      ctrl.parseDirection = function(direction) {
        if(direction == TabulationService.LEFT) {
          return 'L';
        }
        else if(direction == TabulationService.RIGHT) {
          return 'R';
        }
        else {
          return '';
        }
      };

      ctrl.getLastScoreString = function(riderId) {
        var tableScoresForRider = ctrl.tableScoresPerRider[riderId];

        // Determine if there are any table scores not showing
        if(ctrl.rawTableScoresPerRider &&
          ctrl.rawTableScoresPerRider[riderId] &&
          tableScoresForRider &&
          ctrl.rawTableScoresPerRider[riderId].length != tableScoresForRider.length) {
          return 'Pending';
        }
        else {
          // Get the last score from finished scores
          if(tableScoresForRider) {
            var orderedTableScoresForRider = _.orderBy(tableScoresForRider, ['waveNumber'], ['asc']);
            var lastTableScore = _.last(orderedTableScoresForRider);
            if(lastTableScore) {
              var scoreValue = lastTableScore[ctrl.HIGH_SCORE_FIELD];
              if(typeof scoreValue == 'number') {
                return scoreValue.toFixed(2);
              }
              else if(scoreValue instanceof String) {
                return parseFloat(scoreValue).toFixed(2);
              }
              else {
                return scoreValue;
              }
            }
            else {
              return 'N/A';
            }
          }
          else {
            return 'N/A';
          }
        }
      };

      ctrl.$onChanges = function(changesObj) {
        if(changesObj.tableScoresPerRider) {
          ctrl.interferences = getInterferenceScores(changesObj.tableScoresPerRider.currentValue);
        }
      }
    }
  ]
};

module.exports = heatDisplay;