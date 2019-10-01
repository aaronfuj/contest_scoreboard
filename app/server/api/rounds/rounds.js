'use strict';

var express = require('express');
var Round = require('../../../models/round');
var Heat = require('../../../models/heat');
var Score = require('../../../models/score');
var _ = require('lodash');

var Permissions = require('../../../server/permissions.js');

var router = express.Router();

router.get('/', getAllRounds);
router.get('/:id', getRoundWithHeats);
router.post('/', Permissions.isAdmin, createRound);
router.delete('/:id', Permissions.isAdmin, removeRound);

function getAllRounds(req, res) {
    Round.decorateQueryToPopulate(Round.find({}))
      .exec(function (err, rounds) {
        if (err) {
            console.log(err);
            res.status(400).send(err);
        }
        else {
            res.json(rounds);
        }
    });
}

function getRoundWithHeats(req, res) {
    var thePromise = getRoundWithHeatsPromise(req.params.id);
    thePromise.then(
        function(heats) {
            res.json(heats);
        },
        function(error) {
            res.status(500).send(error);
        });
}

function getRoundWithHeatsPromise(roundId) {

    var thePromise = new Promise(function(resolve, reject) {
        Round.decorateQueryToPopulate(Round.findOne({_id: roundId}))
            .exec(function (err, round) {
                if (err) {
                    reject(err);
                }
                else {
                    if(round) {
                        var findHeatsQuery = Heat.find({round: round._id});
                        Heat.decorateQueryToPopulate(findHeatsQuery)
                            .exec(function (err, heats) {
                                if (err) {
                                    reject(err);
                                }
                                else {
                                    round = round.toObject();
                                    if (heats === undefined || heats == null) {
                                        round.heats = [];
                                    }
                                    else {
                                        round.heats = heats;

                                        var heatIds = _.transform(heats, function (result, heat) {
                                            result.push(heat._id);
                                            return result;
                                        }, []);

                                        // Get all of the scores for all of the heats
                                        // TODO: Abstract this out better since its used in the Heat API
                                        Score.find({heat: {$in: heatIds}})
                                            .populate({
                                                path: 'judge',
                                                select: 'local.username'
                                            })
                                            .exec(function (err, scores) {
                                                if (err) {
                                                    reject(err);
                                                }
                                                else {

                                                    // Fill in each heat with the scores that are associated with it
                                                    var filledInHeats = _.transform(scores, function(result, score) {
                                                        var scoreArray = result[score.heat] || (result[score.heat]=[]);
                                                        scoreArray.push(score);
                                                        return result;
                                                    }, {});


                                                    var heatsWithScores = _.transform(heats, function(result, heat) {
                                                        var heatObject = heat.toObject();
                                                        heatObject.scores = filledInHeats[heatObject._id];
                                                        result.push(heatObject);
                                                        return result;
                                                    }, []);

                                                    round.heats = heatsWithScores;

                                                    resolve(round);
                                                }
                                            });
                                    }
                                }
                            });
                    }
                    else {
                        resolve({});
                    }
                }
            });
    });

    return thePromise;
}

function createRound(req, res) {
    console.log(req.body);
    var roundRequest = req.body;
    var newRound = new Round(roundRequest);
    newRound.save(function (err, result, numAffected) {
        if (err) {
            console.log(err);
            res.status(400).send(err);
        }
        else {
            res.json(result);
        }
    });
}

function removeRound(req, res) {
    Round.decorateQueryToPopulate(Round.findByIdAndRemove(req.params.id))
        .exec(function (err, round) {
            if (err) {
                console.log(err);
                return res.status(400).send(err);
            }
            else {
                console.log(round);

                if(round) {
                    var roundId = round._id;
                    Heat.remove({round: roundId}).exec(function (heatErr, heats) {
                       if(heatErr) {
                           console.log(heatErr);
                           return res.status(400).send(heatErr);
                       }
                       else {
                           return res.json(round);
                       }
                    });
                }
                else {
                    return res.json(round);
                }
            }
        });
}

module.exports = router;
