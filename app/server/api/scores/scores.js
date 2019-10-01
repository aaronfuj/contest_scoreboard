'use strict';

var express = require('express');
var Score = require('../../../models/score');
var Heat = require('../../../models/heat');
var Settings = require('../../../models/settings');
var _ = require('lodash');
var router = express.Router();
var SocketFactory = require('../../../server/socket.js');
var Permissions = require('../../../server/permissions.js');

router.get('/all', getAllScores);
router.get('/', Permissions.isAtLeastJudge, getScoresForCurrentUser);
router.get('/current', Permissions.isAtLeastJudge, getScoresForCurrentHeat);
router.get('/:id', getScore);

router.put('/:id', Permissions.isAtLeastJudge, updateScore);
router.post('/', Permissions.isAtLeastJudge, createScore);
router.delete('/:id', Permissions.isAtLeastJudge, removeScore);

var MAX_SCORE_TIME = 30 * 1000; // 30 seconds

function sendScoreToSockets(score) {
    var socketIo = SocketFactory.getInstance();
    socketIo.to(SocketFactory.SCORES_GROUP).emit(SocketFactory.SCORE_UPDATE_EVENT, { score: score });
}

function sendModifiedScoreToSockets(score) {
    var socketIo = SocketFactory.getInstance();
    socketIo.to(SocketFactory.SCORES_GROUP).emit(SocketFactory.SCORE_MODIFIED_EVENT, { score: score });
}

function getAllScores(req, res) {
    Score.find()
        .populate('score.judge', 'local.username')
        .exec(function (err, scores) {
            if (err) {
                console.log(err);
                res.status(400).send(err);
            }
            else {
                res.json(scores);
            }
        });
}

function getScoresForCurrentUser(req, res) {
    if (req.user) {
        Score.find({"score.judge": req.user._id})
            .populate('judge')
            .exec(function (err, scores) {
                if (err) {
                    console.log(err);
                    res.status(400).send(err);
                }
                else {
                    console.log(scores);
                    res.json(scores);
                }
            });
    }
    else {
        res.json([]);
    }
}

/**
 * End point to get all the information for a single active heat and the scores
 * for the heat for this particular logged in user.
 */


function getScoresForCurrentHeat(req, res) {
    if (req.user) {
        Heat.findOne({isActive: true})
            .populate({
                path: 'round riders.rider'
            })
            .exec(function (err, heat) {
                if (err) {
                    console.log(err);
                    res.status(400).send(err);
                }
                else {
                    if (heat === undefined || heat === null) {
                        res.json({});
                    }
                    else {
                        var options = {
                            path: 'round.division',
                            model: 'Division'
                        };

                        Heat.populate(heat, options, function (err, fullyPopulatedHeat) {
                            if (err) {
                                console.log(err);
                                res.status(400).send(err);
                            }
                            else {
                                Score.find({'judge': req.user._id, heat: fullyPopulatedHeat._id})
                                    .populate('rider')
                                    .exec(function (err, scores) {
                                        if (err) {
                                            console.log(err);
                                            res.status(400).send(err);
                                        }
                                        else {
                                            res.json(scores);
                                        }
                                    });
                            }

                        });
                    }
                }
            });
    }
    else {
        res.json([]);
    }
}



function getScore(req, res) {

    Score.findById(req.params.id)
        .populate('judge rider heat')
        .exec(function (err, scores) {
            if (err) {
                console.log(err);
                res.status(400).send(err);
            }
            else {
                console.log(scores);
                res.json(scores);
            }
        });

}



function updateScore(req, res) {
    console.log("Put is put");
    console.log(req.body);

    Score.findByIdAndUpdate(req.params.id,
        req.body,
        {'new': true})
        .populate('judge heat')
        .exec(function (err, score) {
            if (err) {
                console.log(err);
                return res.status(400).send(err);
            }
            else {
                console.log("Updated score");
                console.log(score);
                sendScoreToSockets(score);
                sendModifiedScoreToSockets(score);
                return res.json(score);
            }
        });
}

function checkIfCanEnterScore(scoreRequest, user) {
  return new Promise(function(resolve, reject) {
      if(user) {

          // Check that scores may be added to this heat
          var heatId = scoreRequest.heat;
          var riderId = scoreRequest.rider;

          Settings.getSettingsPromise().then(
              function (settings) {

                  // Check for the wave count if it is required
                  if(settings && _.isNumber(settings.maxWaveCount) && settings.maxWaveCount > 0) {

                      // Get the number of waves this user has scored for this rider for this heat
                      var judgeId = user._id;
                      Score.count({ judge: judgeId, heat: heatId, rider: riderId}, function(err, waveCount) {
                          if(err) {
                              reject("Problem finding a wave count ");
                          }
                          else {
                              if (waveCount >= settings.maxWaveCount) {
                                  reject("Wave count reached for this user");
                              }
                              else {
                                  resolve(true);
                              }
                          }
                      });
                  }
                  else {
                      resolve(true);
                  }
              },
              function (error) {
                  reject(error);
              }
          );
      }
      else {
          resolve(false);
      }
  });
};

function createScore(req, res) {
    if(req.body === undefined || req.body === null) {
        res.status(400).send("No body specified");
        return done();
    }

    var submittedScore = req.body;
    submittedScore.time = Date.now();

    checkIfCanEnterScore(submittedScore, req.user).then(
        function(canEnterScore) {
            if(canEnterScore) {
                getWaveNumberForScore(submittedScore, function (waveNumber) {
                    submittedScore.waveNumber = waveNumber;

                    // console.log("Score with adjusted wave number");
                    // console.log(submittedScore);

                    var newScore = new Score(submittedScore);
                    newScore.save(function (err, result, numAffected) {
                        if (err) {
                            console.log(err);
                            return res.status(400).send(err);
                        }
                        else {
                            Score.populate(newScore, {path: 'judge' }, function (err, populatedScore) {
                                if (err) {
                                    console.log(err);
                                    return res.status(400).send(err);
                                }
                                else {
                                    console.log('Populated result after save');
                                    console.log(populatedScore);
                                    sendScoreToSockets(populatedScore.toObject());
                                    return res.json(populatedScore);
                                }
                            });
                        }
                    });
                });
            }
            else {
                res.status(400).send("No judge information found");
                return done();
            }
        },
        function(error) {
            return res.status(400).send(error);
        }
    );
}



function removeScore(req, res) {
    Score.findByIdAndRemove(req.params.id)
        .populate('judge heat rider')
        .exec(function (err, score) {
            if (err) {
                console.log(err);
                res.status(400).send(err);
            }
            else {
                console.log("Deleted " + score);
                sendModifiedScoreToSockets(score);
                res.json(score);
            }
        });
}

/**
 * Gets all the most recent scores for a particular rider/heat and stores them
 * as a map based on judge id.
 *
 * @param rider the rider id
 * @param heat the heat id
 * @param direction the direction of the scores to get (ignored for now)
 * @param waveNumber the requested wave number (unique per rider in heat)
 * @param callback a callback method to call once the data is ready. This will
 *        be called with a map that contains the different scores, indexed by
 *        judge id. All these scores will be equal to or more recent than the
 *        provided wave number.
 */
var getAllRecentScores = function (rider, heat, direction, waveNumber, callback) {
    Score.find({
            "rider": rider,
            "heat": heat,
            //"direction" : direction, // We will leave this out, and resolve it later
            "waveNumber": {"$gte": waveNumber}
        })
        .sort({waveNumber: 1})
        .exec(function (err, scores) {
            if (err) {
                console.log(err);
                return;
            }

            var scoresPerJudge = {};

            if (scores.length == 0) {
                callback(scoresPerJudge);
                return;
            }
            else {

                // Iterate through all of the scores and put them into a map based on
                // judge. They should be based with the earliest wave numbers first in
                // each
                _.forEach(scores, function (currentScore) {
                    var judge = currentScore.judge;
                    if (scoresPerJudge[judge]) {
                        scoresPerJudge[judge].push(currentScore);
                    }
                    else {
                        scoresPerJudge[judge] = [currentScore];
                    }
                });

                callback(scoresPerJudge);
                return;
            }
        });
};

/**
 * Attempts to get the wave number to use based on a particular score and
 * inspecting scores already in the database.
 *
 * @param score
 * @param callback
 */
var getWaveNumberForScore = function (score, callback) {

    var requestedWaveNumber = score.waveNumber;
    var thisJudge = score.judge;

    // Get all of the scores per judge that are on or waver the desired wave
    // number for this score
    getAllRecentScores(score.rider, score.heat, score.direction, requestedWaveNumber,
        function (scoresPerJudge) {

            // console.log("Scores per judge");
            // console.log(scoresPerJudge);

            // If this map wasn't populated, then there are no scores in for this wave
            // number nor any newer scores (after this wave number) so let's use this
            if (_.isEmpty(scoresPerJudge)) {
                callback(requestedWaveNumber);
                return;
            }
            else {

                // Check to see if this request is actually newer than all the others
                // but the client/judge has missed some scores so we should still
                // consider this a new wave but with a different wave number

                // We need a map of the latest wave numbers and their original start
                // submit times to check against
                var waveNumberToStartTime = {};
                var highestWaveNumberPerJudge = {};
                var highestWaveNumber = 0;
                _.forEach(scoresPerJudge, function (scores, currentJudge) {

                    var highestWaveNumberForJudge = 0;

                    _.forEach(scores, function (currentScore) {
                        // console.log('Current score');
                        // console.log(currentScore);

                        var currentWaveNumber = currentScore.waveNumber;
                        var timeForCurrentScore = currentScore.time.getTime();
                        // console.log('Time for current score');
                        // console.log(timeForCurrentScore);

                        if (waveNumberToStartTime[currentWaveNumber]) {
                            waveNumberToStartTime[currentWaveNumber] = Math.min(waveNumberToStartTime[currentWaveNumber], timeForCurrentScore);
                        }
                        else {
                            waveNumberToStartTime[currentWaveNumber] = timeForCurrentScore;
                        }

                        highestWaveNumberForJudge = Math.max(highestWaveNumberForJudge, currentWaveNumber);
                    });

                    highestWaveNumberPerJudge[currentJudge] = highestWaveNumberForJudge;
                    highestWaveNumber = Math.max(highestWaveNumber, highestWaveNumberForJudge);
                });

                // Do the check based on an offset
                // console.log("Current time");
                // console.log(score.time);
                var millisecondsOffset = MAX_SCORE_TIME;
                var requiredStartTime = score.time - millisecondsOffset;

                // console.log(waveNumberToStartTime);
                var highestSubmittedStartTime = _.max(_.values(waveNumberToStartTime));
                // console.log("Highest start time");
                // console.log(highestSubmittedStartTime);

                // Check that this request is newer than all the others
                if (requiredStartTime > highestSubmittedStartTime) {

                    console.log('No original score sets have been created recently, create a new one now');

                    // Get the wave number based on all existing submitted value
                    var newWaveNumber = highestWaveNumber + 1;
                    callback(newWaveNumber);
                    return;
                }
                else {

                    // This score could still be a new score if this is a bad wave number
                    // and this judge contributed in the last score set

                    // console.log("Highest wave number per judge");
                    // console.log(highestWaveNumberPerJudge);

                    var highestWaveNumberForThisJudge = highestWaveNumberPerJudge[thisJudge];
                    // Check to see if this judge contributed to the last wave number
                    if (highestWaveNumber == highestWaveNumberForThisJudge) {

                        console.log('Judge wave number off, but this is still a new wave, create a new one now');

                        var newWaveNumber = highestWaveNumber + 1;
                        callback(newWaveNumber);
                        return;
                    }
                    else {

                        // By now we know we are no longer starting a new set of scores for
                        // a wave, but instead contributing to an existing set

                        // Limit down the set of scores to only the ones which this judge
                        // hasn't participated in and then work from there to determine
                        // where this score should go
                        console.log();

                        var higherWaveNumbers = _.values(highestWaveNumberPerJudge);

                        if (highestWaveNumberForThisJudge) {
                            higherWaveNumbers = _.filter(higherWaveNumbers, function (currentWaveNumber) {
                                return currentWaveNumber >= highestWaveNumberForThisJudge;
                            });
                        }

                        higherWaveNumbers.sort(function (a, b) {
                            return a - b;
                        });

                        // console.log("Higher wave numbers");
                        // console.log(higherWaveNumbers);
                        for (var i = 0; i < higherWaveNumbers.length; i++) {
                            var currentWaveNumber = higherWaveNumbers[i];

                            if (waveNumberToStartTime[currentWaveNumber] + millisecondsOffset > score.time) {

                                console.log('Adding score for existing wave/score set');
                                callback(currentWaveNumber);
                                return;
                            }
                        }

                        // This should never hit.. but in case it does
                        console.log('ERROR, No existing wave number found, creating new');
                        callback(highestWaveNumber + 1);
                        return;
                    }
                }
            }
        }
    );
};

/**
 * End point for submitted new scores.
 */




module.exports = router;
