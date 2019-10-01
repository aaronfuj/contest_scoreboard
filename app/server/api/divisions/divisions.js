'use strict';

var express = require('express');

var Division = require('../../../models/division');
var Round = require('../../../models/round');
var Heat = require('../../../models/heat');
var _ = require('lodash');

var Permissions = require('../../../server/permissions.js');

var router = express.Router();

router.get('/', getAllDivisions);
router.get('/:id', getDivision);
router.post('/', Permissions.isAdmin, createDivision);
router.delete('/:id', Permissions.isAdmin, removeDivision);

function getAllDivisions(req, res) {
    Division.find({}, function (err, divisions) {
        if (err) {
            console.log(err);
            res.status(400).send(err);
        }
        else {
            res.json(divisions);
        }
    });
};

function getDivision(req, res) {
    Division.findOne({_id: req.params.id})
        .exec(function (err, division) {
            if (err) {
                console.log(err);
                res.status(400).send(err);
            }
            else {

                // Find all the rounds for this division and populate the division object with them
                Round.find({division: division._id})
                    .exec(function (err, rounds) {
                        if (err) {
                            console.log(err);
                            res.status(400).send(err);
                        }
                        else {
                            division = division.toObject();

                            if (rounds === undefined || rounds == null) {
                                division.rounds = [];

                                console.log(division);
                                res.json(division);
                            }
                            else {

                                // Create an array of all of the round ids so that we can query using them
                                var roundIds = _.transform(rounds, function (result, round) {
                                    result.push(round._id);
                                    return result;
                                }, []);

                                // Find all the heats for all of the rounds
                                var heatsQuery = Heat.find({round: {$in: roundIds}});
                                Heat.decorateQueryToPopulate(heatsQuery)
                                    .exec(function (err, heats) {
                                        if (err) {
                                            console.log(err);
                                            res.status(400).send(err);
                                        }
                                        else {
                                            if (heats === undefined || heats === null) {
                                                heats = [];
                                            }

                                            // Fill in each round with the heats in it
                                            var filledInRounds = _.transform(heats, function(result, heat) {
                                                var heatArray = result[heat.round._id] || (result[heat.round._id]=[]);
                                                heatArray.push(heat.toObject());
                                                return result;
                                            }, {});


                                            var roundsWithHeats = _.transform(rounds, function(result, round) {
                                                var roundObject = round.toObject();
                                                roundObject.heats = filledInRounds[roundObject._id];
                                                result.push(roundObject);
                                                return result;
                                            }, []);

                                            division.rounds = roundsWithHeats;

                                            //console.log(division);
                                            res.json(division);
                                        }
                                    });
                            }
                        }
                    });
            }
        });
};

function createDivision(req, res) {
    console.log(req.body);
    var divisionRequest = req.body;
    var newDivision = new Division(divisionRequest);
    newDivision.save(function (err, result, numAffected) {
        if (err) {
            console.log(err);
            res.send(err);
        }
        else {
            res.json(result);
        }
    });
};

function removeDivision(req, res) {
    Division.findByIdAndRemove(req.params.id)
        .populate('divisions')
        .exec(function (err, division) {
            if (err) {
                console.log(err);
                res.status(400).send(err);
            }
            else {
                Round.find({division: req.params.id})
                    .exec(function (err, rounds) {
                        if (err) {
                            console.log(err);
                            res.status(400).send(err);
                        }
                        else {
                            division = division.toObject();
                            if (rounds === undefined || rounds == null) {
                                division.rounds = [];
                            }
                            else {
                                division.rounds = rounds;
                            }

                            console.log(division);
                            res.json(division);
                        }
                    });
            }
        });
};

module.exports = router;
