'use strict';

var _lo = require('lodash');

function Tabulation() {

  //var HIGH_SCORE_FIELD = 'average';
  var HIGH_SCORE_FIELD = 'adjustedAverage';
  var LEFT = 'left';
  var RIGHT = 'right';
  var NO_DIRECTION = 'none';
  var DIRECTIONS = [
    LEFT,
    RIGHT
  ];
  var DIRECTION_COUNT = DIRECTIONS.length;

  var DROP_MIN_MAX = true;
  var MAX_SCORE_TIME = 30 * 1000; // 30 seconds

  var MAJOR_INTERFERENCE = 'major';
  var MINOR_INTERFERENCE = 'minor';

  function roundDecimals(value) {
    return _lo.round(value, 2);
  };

  /**
   * Creates a map of rider id to a list of scores for that rider.
   * riderId -> [ score ]
   */
  function createScoresPerRiderMap(scores) {
    var scoresPerRider = _lo.transform(scores, function(result, score) {
      var scoresForRider = result[score.rider] || (result[score.rider] = []);
      scoresForRider.push(score);
    }, {});

    return scoresPerRider;
  }

  /**
   * Given an array of all of the scores for a particular rider, this maps that
   * based on the wave number as the key a map of the judge id to a score.
   * waveNumber -> { judgeId -> score }
   */
  function createRiderScoresPerWaveNumber(scoresForRider) {
    var waveNumberToJudgeScoreMap = _lo.transform(scoresForRider, function(result, score) {
      var mapForWaveNumber = result[score.waveNumber] || (result[score.waveNumber] = {});
      mapForWaveNumber[score.judge._id] = score;
    }, {});

    return waveNumberToJudgeScoreMap;
  }

  /**
   * Given a map of an array of scores indexed by rider id and a list of all the
   * judges, this creates a new map of the riderId to the list of table scores
   * for that rider.
   *
   * Dictionary of riderId -> [ tableScore ]
   */
  function createTableScoresPerRiderMap(scoresPerRider, judges, finishedScoresOnly) {

    var tableScoresPerRiderMap = {};
    _lo.forEach(scoresPerRider, function(scoresForRider, riderId) {
      tableScoresPerRiderMap[riderId] = createTableScoresForRider(scoresForRider, judges);
    });

    if(finishedScoresOnly) {
      var minimumJudgeScoresNeeded = judges.length;
      //var minimumJudgeScoresNeeded = 3;

      var currentTime = (new Date()).getTime();

      tableScoresPerRiderMap = _lo.reduce(tableScoresPerRiderMap, function(result, tableScoresForRider, riderId) {
        var filteredTableScoresForRider = _lo.filter(tableScoresForRider, function(tableScore) {
          if(!tableScore.judgeScores) {
            return false;
          }

          var actualScores = _lo.filter(tableScore.judgeScores, function(judgeScore) {
            return !!judgeScore.scoreId;
          });
          return actualScores.length >= minimumJudgeScoresNeeded ||
            ((tableScore.firstScoreTime + MAX_SCORE_TIME) < currentTime);
        });
        result[riderId] = filteredTableScoresForRider;
        return result;
      }, {});
    }

    return tableScoresPerRiderMap;
  }

  /**
   * Creates an array of table scores for a particular rider based on being given
   * all the scores for the rider and a list of all the judges that may have
   * entered scores.
   */
  function createTableScoresForRider(scoresForRider, judges) {

    var scoresWithUniqueWaveNumbers = _lo.uniqBy(scoresForRider, function(score) {
      return score.waveNumber;
    });

    var uniqueWaveNumbers = _lo.transform(scoresWithUniqueWaveNumbers, function(result, score) {
    	result.push(score.waveNumber);
    }, []);

    uniqueWaveNumbers.sort(function(a, b) {
      return a - b;
    });

    var tableScores = [];
    _lo.forEach(uniqueWaveNumbers, function(waveNumber) {

      // An array of scores, indexed per judge based on the judges current order
      var judgeScores = [];
      var total = 0;
      var foundScores = 0;
      var firstScoreTime = 0;
      var direction = null;
      var directionCountMap = {};
      var isInterference = false;
      var interferenceType = null;

      var minValue = null;
      var maxValue = null;

      // Get all the scores relevant to this wave number in order per judge
      _lo.forEach(judges, function(judge) {
        var scoreId = null;
        var scoreValue = null;
        var scoreIsInterference = false;
        var currentDirection = null;

        var score = _lo.find(scoresForRider, function(score) {
          return (score.judge._id == judge.id) &&
            (score.waveNumber == waveNumber);
        });

        if(score) {
          scoreId = score._id;
          scoreValue = roundDecimals(score.value);
          currentDirection = score.direction;

          if(directionCountMap[currentDirection]) {
            directionCountMap[currentDirection] = directionCountMap[currentDirection] + 1;
          }
          else {
            directionCountMap[currentDirection] = 1;
          }

          if(score.isInterference) {
            scoreIsInterference = true;
            isInterference = true;

            // Calculate worst case interference
            interferenceType = interferenceType == null ?
              score.interferenceType :
              (interferenceType == MINOR_INTERFERENCE ?
                score.interferenceType :
                interferenceType);
          }

          if(firstScoreTime === 0) {
            firstScoreTime = new Date(score.time).getTime();
          }
          else {
            firstScoreTime = Math.min(firstScoreTime, new Date(score.time).getTime());
          }
        }

        judgeScores.push({
          scoreId: scoreId,
          judge: judge.id,
          value: scoreValue,
          isInterference: scoreIsInterference
        });

        if(_lo.isNumber(scoreValue)) {
          total += scoreValue;
          foundScores++;

          if(DROP_MIN_MAX) {
            if(minValue === null) {
              minValue = scoreValue;
              maxValue = scoreValue;
            }
            else {
              minValue = Math.min(minValue, scoreValue);
              maxValue = Math.max(maxValue, scoreValue);
            }
          }
        }
      });

      // Calculation the majority direction
      if(!_lo.isEmpty(directionCountMap)) {

        var maxCount = 0;
        _lo.forEach(directionCountMap, function(directionCount, currentDirection) {
          if(_lo.isEmpty(direction)) {
            direction = currentDirection;
            maxCount = directionCount;
          }
          else {
            if(directionCount > maxCount) {
              maxCount = directionCount;
              direction = currentDirection;
            }
          }
        });
      }

      // Calculate the average value
      var average = 0;
      if(foundScores > 0) {
        average = roundDecimals(total/foundScores);
      }

      // Calculate the adjusted values
      var adjustedValues = getAdjustedValues(total, minValue, maxValue, foundScores);

      // Create the new object
      tableScores.push({
        waveNumber: waveNumber,
        judgeScores: judgeScores,
        firstScoreTime: firstScoreTime,
        total: roundDecimals(total),
        average: average,
        adjustedTotal: adjustedValues.total,
        adjustedAverage: adjustedValues.average,
        direction: direction,
        isInterference: isInterference,
        interferenceType: interferenceType
      });
    });

    return tableScores;
  }

  /**
   * Creates the adjusted total and average values based off of removing the max/min scores.
   * This will only occur when more than 3 scores exist, otherwise standard total/average is
   * used.
   *
   * @param total the current total score value
   * @param minValue the minimum score value, could be null
   * @param maxValue the maximum score value, could be null
   * @param count the count of how many judges contributed to the total
   * @returns {{total: *, average: *}}
     */
  function getAdjustedValues(total, minValue, maxValue, count) {

    var adjustedTotal = total;
    var adjustedCount = count;
    var adjustedAverage = null;

    var COUNT_MINIMUM = 3;

    if(count > COUNT_MINIMUM) {
      if(_lo.isNumber(minValue) && _lo.isNumber(maxValue)) {
        adjustedTotal = total - minValue - maxValue;

        if(adjustedTotal < 0) {
          adjustedTotal = 0;
        }

        adjustedCount = count - 2;

        if(adjustedCount > 0) {
          adjustedAverage = roundDecimals(adjustedTotal / adjustedCount);
        }
      }
    }
    else {
      adjustedAverage = roundDecimals(total / count);
    }

    return {
      total: roundDecimals(adjustedTotal),
      average: roundDecimals(adjustedAverage)
    };
  }

  /**
   * Evaluates a map of the rider id -> [ tableScore ] and returns a new map that
   * has filtered out only the highest table scores per rider. This does a
   * different calculation based on if this is using the left/right rule or not
   *
   * @param tableScoresPerRider a map of rider id to [ tableScore ]
   * @param maxScoreCount the maximum number of scores that can be used for tabulation
   * @param enableLeftRightRule true if left/right rule is in effect, false/null/undefined otherwise
   * @return {{}}
   */
  function getHighestTableScoresPerRider(tableScoresPerRider, maxScoreCount, enableLeftRightRule) {

    // TODO: Max score count should be per rider, based on the idea that interference may occur and affect the
    // max score fore a particular rider
    var MAX_SCORE_COUNT = maxScoreCount;

    // TODO: These should be determined via settings
    var reduceMaxScoreCount = true;
    var ignoreTopScores = false;

    // This is the field to use for determining what is considered the highest score, can be swapped between
    // average and total
    //var HIGH_SCORE_FIELD = 'average';

    if(enableLeftRightRule) {
      var topValuesPerRider = {};

      // Go through each rider and get the top scores for the rider
      _lo.forEach(tableScoresPerRider, function(tableScoresForRider, riderId) {

        var scoreCountPerDirection = {};
        scoreCountPerDirection[LEFT] = 0;
        scoreCountPerDirection[RIGHT] = 0;

        var topTableScoresForRider = [];
        var orderedTableScoresForRider = _lo.orderBy(tableScoresForRider, [HIGH_SCORE_FIELD], ['desc']);
        var interferenceScores = _lo.filter(tableScoresForRider, function(tableScore) { return tableScore.isInterference; });

        // Determine, based on user based settings, what style of interference this should be:
        // - MINOR: Drop the highest score(s)
        // - MAJOR: Reduce the available amount of scores
        var majorInterferenceCount = _lo.filter(interferenceScores, function(tableScore) {
          return tableScore.interferenceType === null ||
            tableScore.interferenceType === undefined ||
            tableScore.interferenceType.trim() == '' ||
            MAJOR_INTERFERENCE == tableScore.interferenceType
        }).length;
        var minorInterferenceCount = _lo.filter(interferenceScores, function(tableScore) {
          return MINOR_INTERFERENCE == tableScore.interferenceType
        }).length;

        var riderMaxScoreCount = Math.max(0, MAX_SCORE_COUNT-majorInterferenceCount);
        var topScoresToIgnore = minorInterferenceCount;

        // Determine how many scores can be counted per direction
        var maxWavesPerDirection = Math.floor(riderMaxScoreCount / DIRECTION_COUNT);
        if(riderMaxScoreCount % DIRECTION_COUNT > 0) {
          maxWavesPerDirection += 1;
        }

        // TODO: Only do this if it should be applied based on admin settings
        // Limit the scores based on interference
        // var scoresIgnored = 0;
        // var reducedTableScores = _lo.reduce(orderedTableScoresForRider, function(result, tableScore) {
        //   if(scoresIgnored < topScoresToIgnore) {
        //     scoresIgnored++;
        //   }
        //   else {
        //     if(tableScore.isInterference != true) {
        //       result.push(tableScore);
        //     }
        //   }
        //
        //   return result;
        // }, []);

        var filteredOrderedTableScoresForRider = _lo.filter(orderedTableScoresForRider, function(tableScore) {
          return !(tableScore.isInterference === true);
        });
        var reducedTableScores = _lo.drop(filteredOrderedTableScoresForRider, topScoresToIgnore);

        // TODO: Only do this if it should be applied based on admin settings
        // TODO: Limit the maximum number of scores based on interference
        // MAX_SCORE_COUNT = Math.max(0, maxScoreCount - topScoresToIgnore);

        // Go through each of the scores until we've reached the total count
        _lo.forEach(reducedTableScores, function(tableScore) {
          if(topTableScoresForRider.length >= riderMaxScoreCount) {
            return false;
          }

          // If there can be more scores in this direction, add it in
          var currentDirection = tableScore.direction;

          // First create the key/value of 0 if it doesn't exist
          if(!_lo.has(scoreCountPerDirection, currentDirection)) {
            scoreCountPerDirection[currentDirection] = 0;
          }

          // Check that this direction hasn't maxed out, then save in the value if true
          if(scoreCountPerDirection[currentDirection] < maxWavesPerDirection) {
            topTableScoresForRider.push(tableScore);
            scoreCountPerDirection[currentDirection] = scoreCountPerDirection[currentDirection] + 1;
          }
        });

        topValuesPerRider[riderId] = topTableScoresForRider;
      });

      return topValuesPerRider;
    }
    else {
      // TODO: Refactor this into its own function

      var topValuesPerRider = {};
      _lo.forEach(tableScoresPerRider, function(tableScoresForRider, riderId) {

        var orderedTableScoresForRider = _lo.orderBy(tableScoresForRider, [HIGH_SCORE_FIELD], ['desc']);

        var interferenceScores = _lo.filter(tableScoresForRider, function(tableScore) { return tableScore.isInterference; });

        // Determine, based on user based settings, what style of interference this should be:
        // - MINOR: Drop the highest score(s)
        // - MAJOR: Reduce the available amount of scores
        var majorInterferenceCount = _lo.filter(interferenceScores, function(tableScore) {
          return tableScore.interferenceType === null ||
            tableScore.interferenceType === undefined ||
            tableScore.interferenceType.trim() == '' ||
            MAJOR_INTERFERENCE == tableScore.interferenceType
        }).length;
        var minorInterferenceCount = _lo.filter(interferenceScores, function(tableScore) {
          return MINOR_INTERFERENCE == tableScore.interferenceType
        }).length;

        var riderMaxScoreCount = Math.max(0, MAX_SCORE_COUNT-majorInterferenceCount);
        var topScoresToIgnore = minorInterferenceCount;

        var filteredOrderedTableScoresForRider = _lo.filter(orderedTableScoresForRider, function(tableScore) {
          return !(tableScore.isInterference === true);
        });
        var topTableScoresForRider = _lo.drop(filteredOrderedTableScoresForRider, topScoresToIgnore);
        topTableScoresForRider = _lo.take(topTableScoresForRider, riderMaxScoreCount);

        topValuesPerRider[riderId] = topTableScoresForRider;
      });

      return topValuesPerRider;
    }

  }

  /**
   * Given a map of riderId -> [ tableScore ] this will evaluate that map and
   * create a new map which has the sum of the average of all the table scores
   * found for a rider (indexed by riderId).
   *
   * riderId -> 'totalScore' object
   */
  function getTotalScorePerRider(highestTableScoresPerRider) {
    var totalScoresPerRider = {};
    _lo.forEach(highestTableScoresPerRider, function(tableScoresForRider, riderId) {
      var totalScoreForRider = _lo.reduce(tableScoresForRider, function(result, tableScore) {
        result.total += tableScore[HIGH_SCORE_FIELD];
        return result;
      }, { total: 0 });
      totalScoreForRider.total = roundDecimals(totalScoreForRider.total);

      totalScoresPerRider[riderId] = totalScoreForRider;
    });

    return totalScoresPerRider;
  }

  /**
   * Helper function to find the full rider object based on a rider id and looking
   * into a the riders list of the heat (which has additional info like color).
   */
  function findRider(riderId, heatRiders) {
    var riderObject = _lo.find(heatRiders, function(rider) {
      return rider.rider._id == riderId;
    });

    if(riderObject) {
      return riderObject;
    }
  }

  /**
   * Helper function to get all the distinct judges that are found for a
   * collection of scores.
   */
  function findJudges(scores) {
    var scoresWithUniqueJudges = _lo.uniqBy(scores, function(score) {
      if(score.judge && score.judge._id) {
        return score.judge._id;
      }
    });

    var uniqueJudges = _lo.transform(scoresWithUniqueJudges, function(result, score) {
      result.push({
        id: score.judge._id,
        name: score.judge.local.username
      });
    }, []);

    return uniqueJudges;
  }

  /**
   * Given a map of riderId -> [ totalScore ] this will evaluate that map and
   * create an overall resulting ordered list sorted based on the highest scoring
   * rider in the list first.
   */
  function getOverallResults(totalScoresPerRider, heatRiders) {
    var scoresAsArray = _lo.transform(totalScoresPerRider, function(result, totalScore, riderId) {
      var heatRider = findRider(riderId, heatRiders);
      if(_lo.isObject(heatRider)) {
        result.push({
          heatRider: findRider(riderId, heatRiders),
          total: totalScore.total
        });
      }
      return result;
    }, []);

    _lo.forEach(heatRiders, function(riderObject) {

      var foundTotalResult = _lo.find(scoresAsArray, function(totalResult) {
        return totalResult.heatRider.rider._id == riderObject.rider._id;
      });

      if(_lo.isEmpty(foundTotalResult)) {
        scoresAsArray.push({
          heatRider: riderObject,
          total: 0
        });
      }

    });

    var sortedResults = _lo.orderBy(scoresAsArray, ['total'], ['desc']);
    return sortedResults;
  }

  /**
   * Gets an array for all of the table scores for a particular rider in a
   * particular direction (if defined). Table scores are also marked with an
   * additional property 'isHighScore' which identifies if this is one of the
   * highest scores for this rider or not.
   */
  function getTableScoresForRiderWithHighScoresDefined(rider, direction, tableScoresPerRider, highestTableScoresPerRider) {
    var tableScoresForRider = tableScoresPerRider[rider];

    if(direction) {
      tableScoresForRider = _lo.filter(tableScoresForRider, function(tableScore) {
        return (tableScore.direction == direction);
      });
    }

    var highestScores = highestTableScoresPerRider[rider];

    tableScoresForRider = _lo.map(tableScoresForRider, function(tableScore) {
      var foundHighScore = _lo.find(highestScores, function(highestScore) {

        if(direction) {
          return tableScore.waveNumber == highestScore.waveNumber &&
            tableScore.direction == highestScore.direction;
        }
        else {
          return tableScore.waveNumber == highestScore.waveNumber;
        }
      });

      if(foundHighScore) {
        tableScore.isHighScore = true;
      }

      return tableScore;
    });

    return tableScoresForRider;
  }

  /**
   * Goes through all the existing table scores per riders and marks them with a isHighScore
   * flag to be true if it is a highest table score.
   * @param tableScoresPerRider the existing table scores per rider
   * @param highestTableScoresPerRider the highest table scores per rider
   * @return {*}
   */
  function markHighestTableScores(tableScoresPerRider, highestTableScoresPerRider) {

    _lo.forEach(tableScoresPerRider, function(tableScoresForRider, rider) {
      var highestScores = highestTableScoresPerRider[rider];

      _lo.forEach(tableScoresForRider, function(tableScore) {
        var foundHighScore = _lo.find(highestScores, function(highestScore) {
          return tableScore.waveNumber == highestScore.waveNumber;
        });

        if(foundHighScore) {
          tableScore.isHighScore = true;
        }
        else {
          tableScore.isHighScore = false;
        }
      });
    });

    return tableScoresPerRider;
  }

  /**
   * Goes through all the existing table scores per riders and marks them with a isIgnored
   * flag to be true if it is a value higher than the highest score value for the rider.
   *
   * @param tableScoresPerRider the existing table scores per rider
   * @param highestTableScoresPerRider the highest table scores per rider
   * @return {*}
   */
  function markIgnoredTableScores(tableScoresPerRider, highestTableScoresPerRider) {
    _lo.forEach(tableScoresPerRider, function(tableScoresForRider, rider) {

      // Identify the highest score for the rider
      var highestTableScoresForRider = highestTableScoresPerRider[rider];
      if (highestTableScoresForRider) {
        var maxScore = _.maxBy(highestTableScoresForRider, HIGH_SCORE_FIELD);

        if (maxScore) {
          var maxValue = maxScore[HIGH_SCORE_FIELD];

          // Mark any scores which are higher than the highest table scores as 'ignored' due to interference
          _.forEach(tableScoresForRider, function(tableScore) {
            if (tableScore[HIGH_SCORE_FIELD] > maxValue) {
              tableScore.isIgnored = true;
            }
          });
        }
      }
    });
  }

  /**
   * Finds either a number value for what the overall total score for a particular
   * rider is, or returns 'N/A' indicating that no total score was found.
   *
   * TODO: Have this return null or undefined and check for it elsewhere instead
   * and handle that formatting elsewhere.
   */
  function getTotalScoreForRider(riderId, overallResults) {
    var topResults = overallResults;
    var foundResult = _lo.find(topResults, function(topResult) {
      return riderId == topResult.heatRider.rider._id;
    });

    if(foundResult) {
      return foundResult.total;
    }
    else {
      return 'N/A';
    }
  }

  /**
   * Creates a 'scoreNeeded' object for a particular rider which will identify
   * what types of score this rider would need to take the lead.
   */
  function determineScoreNeeded_original(highestTableScoresPerRider, totalScoresPerRider, riderId) {

    var thisRidersTotal = 0;
    var lowestScoreForRider = null;
    var secondLowestScoreForRider = null;

    // Get the highest total value from any rider within the heat
    var highestRiderTotal = _lo.reduce(totalScoresPerRider, function(highestSoFar, totalScoreForRider) {
      return Math.max(highestSoFar, totalScoreForRider.total);
    }, 0);

    // If there are no totals for this rider, then there is no data for this
    // rider
    if(_lo.has(totalScoresPerRider, riderId)) {

      // Get the lowest (scoring) wave for this rider
      var thisRidersScores = highestTableScoresPerRider[riderId];

      var scoredScores = _lo.orderBy(thisRidersScores, [HIGH_SCORE_FIELD], ['asc']);

      lowestScoreForRider = !_lo.isEmpty(scoredScores) ? scoredScores[0] : null;
      var lowestDirection = lowestScoreForRider ? lowestScoreForRider.direction : NO_DIRECTION;

      scoredScores = _lo.filter(scoredScores, function(tableScore) {
        return tableScore.direction != lowestDirection;
      });
      secondLowestScoreForRider = !_lo.isEmpty(scoredScores) ? scoredScores[0] : null;

      // Get this riders highest total
      var totalScore = totalScoresPerRider[riderId];
      thisRidersTotal = totalScore.total;
    }

    var scoreDifference = highestRiderTotal - thisRidersTotal;

    var scoresToCheck = [];
    if(lowestScoreForRider) scoresToCheck.push(lowestScoreForRider);
    if(secondLowestScoreForRider) scoresToCheck.push(secondLowestScoreForRider);

    var minimumScoresNeeded = [];
    _lo.forEach(scoresToCheck, function(scoreToCheck) {

      // Find the impact that improving this lowest score can have
      var MAXIMUM_SCORE = 10;
      var scoreValue = scoreToCheck ? scoreToCheck[HIGH_SCORE_FIELD] : 0;
      var potentialImpactValue = MAXIMUM_SCORE - scoreValue;
      var direction = scoreToCheck ? scoreToCheck.direction : NO_DIRECTION;

      var minimumScoreNeeded = null;

      // Determine if changing just this value can push the rider into first
      if(highestRiderTotal > thisRidersTotal && potentialImpactValue >= scoreDifference) {

        // Get the rider total without the lowest wave
        var baseRiderTotal = thisRidersTotal - scoreValue;

        // Get the new minimum score
        minimumScoreNeeded = highestRiderTotal - baseRiderTotal;

        minimumScoresNeeded.push({
          value: minimumScoreNeeded,
          direction: direction
        });
      }
    });

    var scoreObjectNeeded = {
      value: scoreDifference,
      minimumScoresNeeded: minimumScoresNeeded
    };

    return scoreObjectNeeded;
  }

  function determineScoreNeeded(highestTableScoresPerRider, totalScoresPerRider, riderId, maxScoreCount, enableLeftRightRule) {
    var MAX_COUNT = maxScoreCount;

    // TODO: This should be determined per rider (because interference could occur)
    var MAX_PER_DIRECTION = Math.floor(MAX_COUNT / DIRECTION_COUNT);
    if(MAX_COUNT % DIRECTION_COUNT > 0) {
      MAX_PER_DIRECTION += 1;
    }

    var thisRidersTotal = 0;
    var lowestScoresForRiderPerDirection = {};

    // Get the highest total value from any rider within the heat
    // var highestRiderTotal = _lo.reduce(totalScoresPerRider, function(highestSoFar, totalScoreForRider) {
    //   return Math.max(highestSoFar, totalScoreForRider.total);
    // }, 0);

    // Get the second highest total value from any rider within the heat
    var totalScoresArray = _lo.transform(totalScoresPerRider, function(result, totalScoreForRider, riderId) {
      var totalScoreWithRider = _lo.assign({}, totalScoreForRider);
      totalScoreWithRider.riderId = riderId;
      result.push(totalScoreWithRider);
      return result;
    }, []);

    var orderedTotalScoresPerRider = _lo.orderBy(totalScoresArray, ['total'], ['desc']);

    var highestRiderTotalObject = _lo.nth(orderedTotalScoresPerRider, 0);
    var highestRiderTotal = highestRiderTotalObject ? highestRiderTotalObject.total : 0;

    var secondHighestRiderTotalObject = _lo.nth(orderedTotalScoresPerRider, 1);
    var secondHighestRiderTotal = secondHighestRiderTotalObject ? secondHighestRiderTotalObject.total : 0;

    // If there are no totals for this rider, then there is no data for this
    // rider
    if(_lo.has(totalScoresPerRider, riderId)) {

      // Get the lowest (scoring) wave for this rider
      var highestTableScoresForRider = highestTableScoresPerRider[riderId];

      var orderedHighestTableScoresForRider = _lo.orderBy(highestTableScoresForRider, [HIGH_SCORE_FIELD], ['asc']);

      if(enableLeftRightRule) {
        for (var i=0, length=DIRECTIONS.length; i < length; i++) {
          var direction = DIRECTIONS[i];

          var tableScoresForRiderForDirection = _lo.filter(orderedHighestTableScoresForRider, function(tableScore) {
            return tableScore.direction == direction;
          });

          if(tableScoresForRiderForDirection &&
            (tableScoresForRiderForDirection.length >= MAX_PER_DIRECTION ||
            orderedHighestTableScoresForRider.length >= MAX_COUNT)) {
            lowestScoresForRiderPerDirection[direction] = tableScoresForRiderForDirection[0];
          }
          else {
            var scoreObject = { direction: direction };
            scoreObject[HIGH_SCORE_FIELD] = 0;

            lowestScoresForRiderPerDirection[direction] = scoreObject;
          }
        }
      }
      else {
        var lowestScoreForRider = !_lo.isEmpty(orderedHighestTableScoresForRider) ? orderedHighestTableScoresForRider[0] : null;
        var lowestDirection = lowestScoreForRider ? lowestScoreForRider.direction : NO_DIRECTION;
        lowestScoresForRiderPerDirection[lowestDirection] = lowestScoreForRider;
      }

      // Get this riders highest total
      var totalScore = totalScoresPerRider[riderId];
      thisRidersTotal = totalScore ? totalScore.total : 0;
    }
    // Populate the lowest scores as a shell of a table score with the direction and value of 0
    else {
      if(enableLeftRightRule) {
        for (var i=0, length=DIRECTIONS.length; i < length; i++) {
          var direction = DIRECTIONS[i];

          var scoreObject = { direction: direction };
          scoreObject[HIGH_SCORE_FIELD] = 0;

          lowestScoresForRiderPerDirection[direction] = scoreObject;
        }
      }
      else {
        var scoreObject = { direction: NO_DIRECTION };
        scoreObject[HIGH_SCORE_FIELD] = 0;

        lowestScoresForRiderPerDirection[NO_DIRECTION] = scoreObject;
      }
    }

    var scoreDifference = highestRiderTotal - thisRidersTotal;
    //var secondScoreDifference = secondHighestRiderTotal - thisRidersTotal;

    var firstPlaceScoresNeeded = calculateMinimumScoresNeeded(lowestScoresForRiderPerDirection, highestRiderTotal, thisRidersTotal);
    var secondPlaceScoresNeeded = calculateMinimumScoresNeeded(lowestScoresForRiderPerDirection, secondHighestRiderTotal, thisRidersTotal);

    var scoreObjectNeeded = {
      value: scoreDifference,
      minimumScoresNeeded: firstPlaceScoresNeeded,
      placementScoresNeeded: secondPlaceScoresNeeded
    };

    return scoreObjectNeeded;
  }

  function calculateMinimumScoresNeeded(lowestTableScoresForRiderPerDirection, targetTotal, currentRiderTotal) {
    var scoreDifference = targetTotal - currentRiderTotal;
    var minimumScoresNeeded = [];
    _lo.forEach(lowestTableScoresForRiderPerDirection, function(tableScore) {

      // Find the impact that improving this lowest score can have
      var MAXIMUM_SCORE = 10;
      var scoreValue = tableScore ? tableScore[HIGH_SCORE_FIELD] : 0;
      var potentialImpactValue = MAXIMUM_SCORE - scoreValue;
      var direction = tableScore ? tableScore.direction : NO_DIRECTION;

      var minimumScoreValueNeeded = null;

      // Determine if changing just this value can push the rider into first
      if(targetTotal > currentRiderTotal && potentialImpactValue >= scoreDifference) {

        // Get the rider total without the lowest wave
        var baseRiderTotal = currentRiderTotal - scoreValue;

        // Get the new minimum score
        minimumScoreValueNeeded = targetTotal - baseRiderTotal;

        minimumScoresNeeded.push({
          value: minimumScoreValueNeeded,
          direction: direction
        });
      }
    });

    return minimumScoresNeeded;
  }

  /**
   * Determines the overall rider ranks from investigating all the scores based off of a max count
   * and then breaking any ties that occur if possible.
   *
   * @param allTableScoresPerRider all the table scores per rider for this heat
   * @param maxCount the maximum wave count to use
   * @param enableLeftRightRule boolean for whether or not to use the left/right rule
   * @param heatRiders array of the heatRiders in the heat
   * @return {{riderIdToRank, tiedRiders}|Array|Object}
   */
  function getCompleteRiderRanks(allTableScoresPerRider, maxCount, enableLeftRightRule, heatRiders) {
    var highestTableScoresPerRider = getHighestTableScoresPerRider(allTableScoresPerRider, maxCount, enableLeftRightRule);
    return getResultsAfterTiebreak(allTableScoresPerRider, highestTableScoresPerRider,
      highestTableScoresPerRider, maxCount, heatRiders, maxCount);
  }

  /**
   * Recursive function to get the rider ranking results by breaking the ties that exist
   *
   * @param allTableScoresPerRider the original source of all table scores per rider
   * @param originalHighestTableScoresPerRider the first iteration of highest table scores per rider
   * @param currentHighTableScoresPerRider the current iteration of highest table scores per rider
   * @param MAX_COUNT the maximum count to use as a start
   * @param heatRiders an array of all the heatRiders to evaluate scores for
   * @param previousMaxCount the last evaluated max count
   * @return {{riderIdToRank, tiedRiders}|Array|Object}
   */
  function getResultsAfterTiebreak(allTableScoresPerRider, originalHighestTableScoresPerRider,
                                   currentHighTableScoresPerRider, MAX_COUNT, heatRiders, previousMaxCount) {
    var totalScoresPerRider = getTotalScorePerRider(currentHighTableScoresPerRider);
    var overallResults = getOverallResults(totalScoresPerRider, heatRiders);

    // TODO: Need to do something to determine how to use interference for changing max count
    // per rider

    // Create arrays of tied riders, this array should contain an array for each set of
    // riders which are tied with each other. For example, if 1/2 are tied and 3/4 are tied,
    // then it should be [ [1, 2], [3, 4] ]
    var riderRanks = getRiderRanks(overallResults, totalScoresPerRider);

    if(riderRanks.tiedRiders.length > 0) {

      var currentMaxCount = generateNextCount(MAX_COUNT, previousMaxCount);
      _lo.forEach(riderRanks.tiedRiders, function(tiedHeatRiderArray) {

        var newHighestTableScoresPerRider = getTiebreakingHighestTableScoresPerRider(tiedHeatRiderArray,
            allTableScoresPerRider, originalHighestTableScoresPerRider, MAX_COUNT, currentMaxCount);

        var maxTableScoresFound = _lo.reduce(newHighestTableScoresPerRider, function(result, highestTableScoresForRider) {
          return Math.max(result, highestTableScoresForRider.length);
        }, 0);

        if(maxTableScoresFound < currentMaxCount) {
          console.log('Unable to break the tie, not enough scores present');
          return riderRanks;
        }

        var tieBrokenRiderRanks = getResultsAfterTiebreak(allTableScoresPerRider, originalHighestTableScoresPerRider,
            newHighestTableScoresPerRider, MAX_COUNT, tiedHeatRiderArray, currentMaxCount);

        var originalRiderIdToRank = riderRanks.riderIdToRank;
        var riderIdToRankFromTieBreak = tieBrokenRiderRanks.riderIdToRank;
        var adjustedRiderIdToRankFromTieBreak = _lo.transform(riderIdToRankFromTieBreak, function(result, rank, riderId) {
          var originalRank = originalRiderIdToRank[riderId] || 0;
          return result[riderId] = originalRank + rank - 1;
        }, {});

        riderRanks.riderIdToRank = _lo.assign(riderRanks.riderIdToRank, adjustedRiderIdToRankFromTieBreak);
      });

      // There should be no tied riders, so clear it out
      riderRanks.tiedRiders = [];

      return riderRanks;
    }
    else {
      return riderRanks;
    }
  }

  /**
   *
   * @param riderIds
   * @param tableScoresPerRider
   * @return {*}
   */
  function getMaxWavesRidden(riderIds, tableScoresPerRider) {
    var maxWavesRidden = _lo.reduce(tableScoresPerRider, function(result, tableScoresForRider, riderId) {
      if(_lo.has(riderIds, riderId)) {
        return Math.max(result, tableScoresForRider.length);
      }
      else {
        return result;
      }
    }, 0);

    return maxWavesRidden;
  }

  /**
   * Generates the next count based on what the current count is and the original count.
   * Counting occurs by attempting to get the next closest number to the original by alternating
   * with the lower value first followed by the higher value.
   * @param originalMaxCount the original maximum count
   * @param currentMaxCount the current maximum count
   * @return {*} the next maximum count
   */
  function generateNextCount(originalMaxCount, currentMaxCount) {
    if(currentMaxCount < originalMaxCount) {
      var difference = originalMaxCount - currentMaxCount;
      return originalMaxCount + difference;
    }
    else {
      var difference = currentMaxCount - originalMaxCount + 1;
      if(currentMaxCount - difference > 0) {
        return currentMaxCount - difference;
      }
      else {
        return originalMaxCount + difference;
      }
    }
  }

  /**
   * Generates a new object/dictionary for the highest table scores to break ties
   *
   * @param heatRiders an array of heatRiders to evaluate the scores for
   * @param tableScoresPerRider all of the table scores mapped by rider id
   * @param originalHighestTableScoresPerRider the original highest table scores per rider map
   * @param originalMaxCount the original maximum count used for generating highest table scores per rider
   * @param maxCount the current maximum count to determine the new highest table scores
   * @return {*} a new object/dictionary mapping the highest table scores per rider for this new count
   */
  function getTiebreakingHighestTableScoresPerRider(heatRiders, tableScoresPerRider, originalHighestTableScoresPerRider,
                                                    originalMaxCount, maxCount) {
    if(maxCount < originalMaxCount) {
      var tiebreakingHighestTableScoresPerRider = _lo.transform(originalHighestTableScoresPerRider, function(result, tableScoresForRider, riderId) {
        result[riderId] = _lo.take(tableScoresForRider, maxCount);
      }, {});
      return tiebreakingHighestTableScoresPerRider;
    }
    else {
      var tiebreakingHighestTableScoresPerRider = {};
      var additionalScores = maxCount - originalMaxCount;

      _lo.forEach(heatRiders, function(heatRider) {
        var riderId = heatRider.rider._id;
        var tableScoresForRider = tableScoresPerRider[riderId] || [];
        var originalHighestTableScoresForRider = originalHighestTableScoresPerRider[riderId] || [];
        var foundTableScores = _lo.transform(originalHighestTableScoresForRider, function(result, tableScore) {
          result[tableScore.waveNumber] = true;
          return result;
        }, {});

        var addedScores = 0;
        var tiebreakingHighestTableScoresForRider = originalHighestTableScoresForRider.slice();
        _lo.forEach(tableScoresForRider, function(tableScore) {
          if(addedScores < additionalScores) {
            if(!(foundTableScores[tableScore.waveNumber])) {
              tiebreakingHighestTableScoresForRider.push(tableScore);
              addedScores++;
            }
          }
        });

        tiebreakingHighestTableScoresPerRider[riderId] = tiebreakingHighestTableScoresForRider;
      });

      return tiebreakingHighestTableScoresPerRider;
    }
  }



  /**
   * Create arrays of tied riders, this array should contain an array for each set of
   * riders which are tied with each other. For example, if 1/2 are tied and 3/4 are tied,
   * then it should be [ [1, 2], [3, 4] ]
   *
   * @param overallResults the sorted by value results to inspect to determine the tied riders
   * @param totalScoresPerRider the total scores per rider, may be undefined
   * @return {Array|Object}
   */
  function getRiderRanks(overallResults, totalScoresPerRider) {
    var previousTotal = undefined;
    var inTie = false;
    var riderIdToRank = {};
    var rankPosition = 1;
    var ridersRankPosition = 1;
    var previousRider = undefined;

    var tiedRiderArrays = _lo.transform(overallResults, function(runningResult, overallResult) {
      if(_lo.isNumber(previousTotal)) {
        if(overallResult.total == previousTotal) {
          if(!inTie) {
            var riderTieSubset = [];
            riderTieSubset.push(previousRider);
            riderTieSubset.push(overallResult.heatRider);
            runningResult.push(riderTieSubset);
          }
          else {
            var riderTieSubset = runningResult[runningResult.length-1];
            riderTieSubset.push(overallResult.heatRider);
          }
          inTie = true;
        }
        else {
          if(inTie) {
            inTie = false;
          }

          ridersRankPosition = rankPosition;
        }
      }

      var riderId = overallResult.heatRider.rider._id;
      riderIdToRank[riderId] = ridersRankPosition;
      rankPosition++;

      previousTotal = overallResult.total;
      previousRider = overallResult.heatRider;
    }, []);

    return {
      riderIdToRank: riderIdToRank,
      tiedRiders: tiedRiderArrays,
      originalTiedRiders: tiedRiderArrays,
      totalScoresPerRider: totalScoresPerRider
    };
  }

  /**
   *
   * @param heatRiders all the tied riders to perform the tiebreak for
   * @param tableScoresPerRider all the table scores per rider
   * @param highestTableScoresPerRider the original highest table scores per each rider
   * @return an ordered array (with best rank first) of tiebreak objects:
   *
   *  {
   *    heatRider: heatRider,
   *    relativeRank: (Number, starting at 1)
   *    scores: [ (Score) ] - ordered by best (original) scores first
   *    totalUsed: (Number)
   *  }
   *
   */

  return {
    HIGH_SCORE_FIELD: HIGH_SCORE_FIELD,
    LEFT: LEFT,
    RIGHT: RIGHT,

    createScoresPerRiderMap: createScoresPerRiderMap,
    createRiderScoresPerWaveNumber: createRiderScoresPerWaveNumber,
    createTableScoresPerRiderMap: createTableScoresPerRiderMap,
    getHighestTableScoresPerRider: getHighestTableScoresPerRider,
    getTotalScorePerRider: getTotalScorePerRider,
    findRider: findRider,
    findJudges: findJudges,
    getOverallResults: getOverallResults,
    getTableScoresForRiderWithHighScoresDefined: getTableScoresForRiderWithHighScoresDefined,
    markHighestTableScores: markHighestTableScores,
    markIgnoredTableScores: markIgnoredTableScores,
    getTotalScoreForRider: getTotalScoreForRider,
    determineScoreNeeded: determineScoreNeeded,

    // Helper functions
    generateNextCount: generateNextCount,
    getMaxWavesRidden: getMaxWavesRidden,
    getRiderRanks: getRiderRanks,

    // Final ranking
    getCompleteRiderRanks: getCompleteRiderRanks,

    // Exposed for testing
    getResultsAfterTiebreak: getResultsAfterTiebreak,
    getTiebreakingHighestTableScoresPerRider: getTiebreakingHighestTableScoresPerRider
  };
};

module.exports = Tabulation;


