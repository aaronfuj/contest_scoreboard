'use strict';

var express = require('express');
var Heat = require('../../../models/heat');
var Score = require('../../../models/score');
var router = express.Router();

var SocketFactory = require('../../../server/socket.js');
var Permissions = require('../../../server/permissions.js');

router.get('/', getAllHeats);
router.get('/finals', getFinalHeats);
router.get('/:id', getHeatWithScores);
router.delete('/:id', Permissions.isAdmin, deleteHeat);

router.put('/:id/addrider', Permissions.isAdmin, addRiderToHeat);
router.delete('/:id/:heatRiderId', Permissions.isAdmin, removeRiderFromHeat);
router.post('/', Permissions.isAdmin, createHeat);

function sendHeatUpdateToSockets(heat) {
  var socketIo = SocketFactory.getInstance();
  socketIo.to(SocketFactory.ACTIVE_HEAT_GROUP).emit(SocketFactory.HEAT_UPDATE_EVENT, { heats: [ heat ] });
}

function getAllHeats(req, res) {
    var allHeatsQuery = Heat.find();

    Heat.decorateQueryToPopulate(allHeatsQuery)
        .exec(function (err, heats) {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            }
            else {
                res.json(heats);
            }
        });
}

function deleteHeat(req, res) {
  Heat.decorateQueryToPopulate(Heat.findByIdAndRemove(req.params.id))
    .exec(function (err, heat) {
      if (err) {
        console.log(err);
        res.status(400).send(err);
      }
      else {
        console.log(heat);
        res.json(heat);
      }
    });
}

function getHeatWithScores(req, res) {
    var singleHeatQuery = Heat.findOne({_id: req.params.id});

    Heat.decorateQueryToPopulate(singleHeatQuery)
        .exec(function (err, heat) {
            if (err) {
                console.log(err);
                res.status(400).send(err);
            }
            else {
                if(heat) {
                    Score.find({
                            heat: heat._id
                        })
                        .populate({
                            path: 'judge',
                            select: 'local.username'
                        })
                        .exec(function (err, scores) {

                            if (err) {
                                console.log(err);
                                res.send(err);
                            }
                            else {
                                heat = heat.toObject();
                                heat.scores = scores;
                                //console.log(heat);
                                res.json(heat);
                            }
                        });
                }
                else {
                    return res.status(400).send('Unable to find heat');
                }
            }
        });
}

function getFinalHeats(req, res) {
  var finalHeatName = 'Final';
  var promise = new Promise(
    function(resolve, reject) {
      var heatQuery = Heat
        .find({name: {'$regex': finalHeatName, $options:'i'}});

      Heat.decorateQueryToPopulate(heatQuery)
        .exec(function (err, heats) {
            if (err) {
              console.log(err);
              reject(err);
            }
            else {
              console.log('Heats', heats);

              if (heats === undefined || heats === null) {
                heats = [];
              }

              resolve(heats);
            }
          }
        );
    }
  );

  promise.then(
    function(results) {

      //console.log('results', results);
      //var flattendHeats = [].concat.apply([], results);
      var flattenedHeats = results;

      //console.log('flatt', flattendHeats);
      var heatsWithScoresPromise = Score.createHeatsWithScoresPromise(flattenedHeats);
      heatsWithScoresPromise.then(
        function(finalHeats) {
          return res.json(finalHeats);
        },
        function(error) {
          return res.status(400).send(error);
        }
      );


    },
    function(error) {
      return res.status(400).send(error);
    }
  );
}

function addRiderToHeat(req, res) {
    var addRiderQuery = Heat.findByIdAndUpdate(req.params.id,
        {$push: {riders: req.body}},
        {'new': true});

    Heat.decorateQueryToPopulate(addRiderQuery)
        .exec(function (err, heat) {
            if (err) {
                console.log(err);
                res.status(400).send(err);
            }
            else {
                sendHeatUpdateToSockets(heat);
                res.json(heat);
            }
        });
};


function removeRiderFromHeat(req, res) {
    var removeRiderQuery = Heat.findByIdAndUpdate(req.params.id,
        {$pull: {'riders': {'_id': req.params.heatRiderId}}},
        {'new': true});

    Heat.decorateQueryToPopulate(removeRiderQuery)
        .exec(function (err, heat) {
            if (err) {
                console.log(err);
                res.status(400).send(err);
            }
            else {
                sendHeatUpdateToSockets(heat);
                res.json(heat);
            }
        });
}


function createHeat(req, res) {
    console.log(req.body);
    var heatRequest = req.body;
    var newHeat = new Heat(heatRequest);
    newHeat.save(function (err, result, numAffected) {
        if (err) {
            console.log(err);
            res.status(400).send(err);
        }
        else {
            res.json(result);
        }
    });
}

module.exports = router;
