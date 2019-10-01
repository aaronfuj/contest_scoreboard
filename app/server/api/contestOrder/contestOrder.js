'use strict';

var express = require('express');
var Heat = require('../../../models/heat');
var Round = require('../../../models/round');
var ContestOrder = require('../../../models/contestOrder');

var _ = require('lodash');
var Permissions = require('../../../server/permissions.js');

var ObjectID = require("mongoose").Types.ObjectId;

var router = express.Router();

router.get('/', getContestOrder);
router.put('/', Permissions.isAdmin, updateContestOrder);
router.get('/heat/:id', getActiveHeatWithSiblings);

function getContestOrderPromise () {
  return new Promise(function(resolve, reject) {
    var contestOrderPromise = ContestOrder.decorateQueryToPopulate(ContestOrder.findOne()).lean().exec();
    var allRoundsPromise = Round.decorateQueryToPopulate(Round.find({})).lean().exec();

    Promise.all([contestOrderPromise, allRoundsPromise]).then(
      function(results) {

        var combinedResult = results[0] || { rounds: [] };
        var allRounds = results[1] || [];

        var orderedRounds = combinedResult.rounds;

        // Create lookup list
        var orderedRoundIds = _.reduce(orderedRounds, function(result, round) {
          var roundId = round._id;

          // Ensure this round id isn't already in the list
          var foundIndex = _.findIndex(result, roundId);
          if(foundIndex == -1) {
            result.push(roundId);
            console.log(roundId);
          }

          return result;
        }, []);

        // Find all rounds not included in the order
        var nonOrderedRounds = _.reduce(allRounds, function(result, round) {
          var roundId = round._id;

          // Check that the round id doesn't exist in the ordered list
          var foundIndex = _.findIndex(orderedRoundIds, roundId);
          if(foundIndex == -1) {
            result.push(round);
            console.log(roundId);
          }

          return result;
        }, []);

        console.log('Rounds not ordered ' + nonOrderedRounds.length);

        // Combine the ordered rounds and the unordered rounds
        combinedResult.rounds.push.apply(combinedResult.rounds, nonOrderedRounds);

        console.log("Total Ordered Rounds Count " + combinedResult.rounds.length);
        return resolve(combinedResult);
      },
      function(errors) {
        console.log(errors);
        return reject(errors);
      }
    );
  });
};

function getContestOrder (req, res) {
  getContestOrderPromise().then(
    function(contestOrder) {
      return res.json(contestOrder);
    },
    function(error) {
      return res.status(500).send(error);
    }
  );
};

function updateContestOrder (req, res) {
  var newRounds = req.body.rounds;
  ContestOrder.findOne().exec(function (err, contestOrder) {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    }
    else {
      // Update existing order if it exists
      if (contestOrder) {
        contestOrder.rounds = newRounds;

        contestOrder.save(function (err) {
          if (err) {
            console.log(err);
            res.status(400).send(err);
          }
          else {
            res.json(contestOrder);
          }
        });
      }
      else {

        // If no contest order object exists, create a new one
        var contestOrderObject = { rounds: newRounds };
        var newContestOrder = new ContestOrder(contestOrderObject);
        newContestOrder.save(function (err, result, numAffected) {
          if (err) {
            console.log(err);
            res.status(400).send(err);
          }
          else {
            res.json(result);
          }
        });
      }

    }
  });
};


function createHeatPromise(heatId) {
  console.log('createHeatPromise' + heatId);
  return new Promise(function(resolve, reject) {
    var singleHeatQuery = Heat.findOne({_id: heatId}).lean();
    Heat.decorateQueryToPopulate(singleHeatQuery).exec(function (err, results) {
      if (err) {
        console.log('createHeatPromise fail' + heatId);
        return reject(err);
      }
      else {
        // Ensure the ids use (heat and round) are strings
        results._id = results._id.toString();
        results.round._id = results.round._id.toString();
        return resolve(results);
      }
    });
  });
};

/**
 * Creates a promise where the result should be an object map of:
 * roundId -> [ heat ]
 *
 * The list of heats should be ordered for the round
 *
 * The internal object ids for the heat and the round should be strings.
 *
 * @return {Promise}
 */
function getRoundToHeatsPromise() {
  return new Promise(function(resolve, reject) {
    Heat.decorateQueryToPopulate(Heat.find()).lean()
      .exec(function(err, results) {
        if(err) {
          return reject(err);
        }
        else {
          if(results) {

            // Map of roundId to list of heats in the round
            var roundToHeats = {};

            _.forEach(results, function(heat) {

              // Ensure the object ids are strings
              heat._id = heat._id.toString();
              heat.round._id = heat.round._id.toString();

              var roundId = heat.round._id;

              var heatsInRound = (roundToHeats[roundId] || []);
              heatsInRound.push(heat);
              roundToHeats[roundId] = heatsInRound;
            });

            return resolve(roundToHeats);
          }
          else {
            return reject("No results");
          }
        }
      });
  });

};

function findPreviousHeat(heatId, roundId, orderedRounds, roundToHeatsMap) {
  var heatsInRound = roundToHeatsMap[roundId];

  if(heatsInRound) {
    var currentHeatIndex = _.findIndex(heatsInRound, function(heat) {
      return heat._id == heatId;
    });

    // If we were unable to find this heat in the round, we have a problem
    if (currentHeatIndex == -1) {
      console.error('Unable to find heat ' + heatId + ' in round ' + roundId);
      return null;
    }

    // If this isn't the first heat of the round, then we can use the adjacent previous heat
    if (currentHeatIndex > 0) {
      return heatsInRound[currentHeatIndex-1];
    }
    else {
      var currentRoundId = roundId;

      // Keep searching previous rounds until we get a heat
      while(currentRoundId != null && currentRoundId != undefined) {

        // Get the previous round and its heats
        var currentRoundIndex = _.findIndex(orderedRounds, function(round) {
          return round._id == currentRoundId;
        });

        // If this is the first round or we can't find this round, there is no previous heat
        if(currentRoundIndex <= 0) {
          console.log('Unable to find round or is first round');
          return null;
        }
        else {
          var previousRound = orderedRounds[currentRoundIndex-1];
          var heatsInPreviousRound = roundToHeatsMap[previousRound._id];

          // If there are heats in the previous round, grab the last one
          if(heatsInPreviousRound && heatsInPreviousRound.length > 0) {
            console.log('Found previous heat in round ' + previousRound._id);
            return heatsInPreviousRound[heatsInPreviousRound.length-1];
          }
          else {
            currentRoundId = previousRound._id;
          }
        }
      }
    }
  }
  else {
    console.log('No heats in round ' + roundId);
    return null;
  }
};

function findNextHeat(heatId, roundId, orderedRounds, roundToHeatsMap) {
  var heatsInRound = roundToHeatsMap[roundId];

  if(heatsInRound) {
    var currentHeatIndex = _.findIndex(heatsInRound, function(heat) {
      return heat._id == heatId;
    });

    // If we are unable to find this heat, we have a problem
    if (currentHeatIndex == -1) {
      console.error('Unable to find heat ' + heatId + ' in round ' + roundId);
      return null;
    }

    // If this isn't the last heat in the round, then grab the next heat
    if (currentHeatIndex < heatsInRound.length-1) {
      return heatsInRound[currentHeatIndex+1];
    }
    else {
      var currentRoundId = roundId;

      while(currentRoundId != null && currentRoundId != undefined) {
        console.log('Current Round ID: ' + currentRoundId);

        var currentRoundIndex = _.findIndex(orderedRounds, function(orderedRound) {
          var orderedRoundId = orderedRound._id;
          return orderedRoundId == currentRoundId;
        });

        // If this couldn't be found or this is the last heat, there is no next heat
        if(currentRoundIndex == -1) {
          console.log('Unable to find round');
          return null;
        }
        else if(currentRoundIndex == (orderedRounds.length - 1)) {
          console.log('This is the last round');
          return null;
        }
        else {
          var nextRoundId = orderedRounds[currentRoundIndex+1]._id;
          var heatsInNextRound = roundToHeatsMap[nextRoundId];

          // If there are heats in the next round, grab the first one
          if(heatsInNextRound && heatsInNextRound.length > 0) {
            console.log('Found next heat in round ' + nextRoundId);
            return heatsInNextRound[0];
          }
          else {
            currentRoundId = nextRoundId;
          }
        }
      }
    }
  }
  else {
    console.log('No heats in round ' + roundId);
    return null;
  }
};

function getActiveHeatWithSiblingsPromise (heatId) {
  console.log('getActiveHeatWithSiblingsPromise: ' + heatId);
  var thePromise = new Promise(function(resolve, reject) {
    createHeatPromise(heatId).then(
      function(heat) {

        if (heat == null) {
          return reject('No heat found');
        }

        var roundId = heat.round._id;

        Promise.all([getContestOrderPromise(), getRoundToHeatsPromise()]).then(
          function(bothPromiseResults) {
            var contestOrder = bothPromiseResults[0];
            var roundToHeatsMap = bothPromiseResults[1];

            var previousHeat = findPreviousHeat(heatId, roundId, contestOrder.rounds, roundToHeatsMap);
            var nextHeat = findNextHeat(heatId, roundId, contestOrder.rounds, roundToHeatsMap);

            var finalResult = {
              currentHeat: heat,
              previousHeat: previousHeat,
              nextHeat: nextHeat
            };
            return resolve(finalResult);
          },
          function(err) {
            return reject(err);
          }
        );
      },
      function(error) {
        return reject(error);
      });
  });
  return thePromise;
};

function getActiveHeatWithSiblings (req, res) {
  getActiveHeatWithSiblingsPromise(req.params.id).then(
    function(success) {
      return res.json(success);
    },
    function(error) {
      return res.status(500).send(error);
    }
  );
};


module.exports = router;
