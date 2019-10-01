'use strict';

var express = require('express');
var Rider = require('../../../models/rider');
var _ = require('lodash');

var Permissions = require('../../../server/permissions.js');

var router = express.Router();

router.get('/', getAllRiders);
router.post('/', Permissions.isAdmin, createRider);
router.delete('/:id', Permissions.isAdmin, removeRider);

function getAllRiders(req, res) {

    Rider.find()
        .populate('divisions')
        .exec(function (err, riders) {
            if (err) {
                console.log(err);
                res.status(400).send(err);
            }
            else {
                // If there are query parameters and one is the division, filter on it
                if (req.query && req.query.division) {

                    var filteredRiders = _.filter(riders, function (rider) {
                        var foundDivision = _.find(rider.divisions, function (division) {
                            return division._id == req.query.division;
                        });

                        if (foundDivision) {
                            return true;
                        }
                        else {
                            return false;
                        }
                    });

                    res.json(filteredRiders);
                }
                else {
                    res.json(riders);
                }
            }
        });
}



function createRider(req, res) {
    var riderRequest = req.body;
    var newRider = new Rider(riderRequest);
    newRider.save(function (err, result, numAffected) {
        if (err) {
            console.log(err);
            res.status(400).send(err);
        }
        else {
            Rider.populate(result, {path: 'divisions'}, function (err, populatedRider) {
                if (err) {
                    console.log(err);
                    res.send(err);
                }
                else {
                    res.json(populatedRider)
                }
            });
        }
    });
}



function removeRider(req, res) {
    Rider.findByIdAndRemove(req.params.id)
        .populate('divisions')
        .exec(function (err, rider) {
            if (err) {
                console.log(err);
                res.status(400).send(err);
            }
            else {
                console.log(rider);
                res.json(rider);
            }
        });
}

module.exports = router;
