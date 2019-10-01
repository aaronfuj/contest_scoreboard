'use strict';

var express = require('express');
var Heat = require('../../../models/heat');

var _ = require('lodash');
var SocketFactory = require('../../../server/socket.js');
var Permissions = require('../../../server/permissions.js');

var router = express.Router();

router.get('/', getAllActiveHeats);
//router.get('/:id', getActiveHeatWithSiblings);
router.post('/:id', Permissions.isAdmin, setActiveHeat);
router.delete('/:id', Permissions.isAdmin, removeActiveHeat);

function sendHeatUpdateToSockets(heats) {
    var socketIo = SocketFactory.getInstance();
    socketIo.to(SocketFactory.ACTIVE_HEAT_GROUP).emit(SocketFactory.HEAT_UPDATE_EVENT, { heats: heats });
}

function queryAndReturnResponse(query, res, sendSocketUpdate) {
    Heat.decorateQueryToPopulate(query)
        .exec(function (err, results) {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            else {
                if(sendSocketUpdate) {
                    sendHeatUpdateToSockets(results);
                }
                return res.json(results);
            }
        });
};

function getAllActiveHeats (req, res) {
    return queryAndReturnResponse(Heat.find({isActive: true}).lean(), res);

    // Heat.find({isActive: true})
    //     .populate({
    //         path: HEAT_POPULATE_PATH
    //     })
    //     .exec(function (err, heat) {
    //         if (err) {
    //             console.log(err);
    //             res.status(500).send(err);
    //         }
    //         else {
    //             populateHeatsWithDivisionsAndRespond(heat, res);
    //         }
    //     });
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

        console.log('createHeatPromise good' + heatId);
        return resolve(results);
      }
    });
  });
};

function findPreviousHeat(heatId) {
  return new Promise(function(resolve, reject) {
    Heat.findOne({_id: {$lt: heatId}}).sort({_id: -1}).lean().exec(function (err, results) {
      if (err) {
        return resolve(heatId);
      }
      else {
        if(results == null) {
          return resolve(null);
        }
        else {
          console.log(results);
          return resolve(results._id);
        }
      }
    })
  });
}

function findNextHeat(heatId) {
  return new Promise(function(resolve, reject) {
    Heat.findOne({_id: {$gt: heatId}}).sort({_id: 1}).lean().exec(function (err, results) {
      if (err) {
        return resolve(heatId);
      }
      else {
        if(results == null) {
          return resolve(null);
        }
        else {
          console.log(results);
          return resolve(results._id);
        }
      }
    })
  });
}

function getActiveHeatWithSiblingsPromise (heatId) {
  console.log('getActiveHeatWithSiblingsPromise: ' + heatId);
  var thePromise = new Promise(function(resolve, reject) {
    createHeatPromise(heatId).then(
      function(heat) {

        Promise.all([findPreviousHeat(heatId), findNextHeat(heatId)]).then(
          function(heatIds) {

            var previousHeatId = heatIds[0];
            var previousHeatPromise;

            var nextHeatId = heatIds[1];
            var nextHeatPromise;

            if(previousHeatId) {
              previousHeatPromise = createHeatPromise(previousHeatId);
            }
            else {
              previousHeatPromise = Promise.resolve(null);
            }

            if(nextHeatId) {
              nextHeatPromise = createHeatPromise(nextHeatId);
            }
            else {
              nextHeatPromise = Promise.resolve(null);
            }

            Promise.all([previousHeatPromise, nextHeatPromise]).then(
              function(results) {
                var finalResult = {
                  currentHeat: heat,
                  previousHeat: results[0],
                  nextHeat: results[1]
                };
                return resolve(finalResult);
              },
              function(error) {
                return reject(error);
              }
            );
          },
          function(error) {
            return reject(error);
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

function setActiveHeat (req, res) {
    return queryAndReturnResponse(Heat.findByIdAndUpdate(req.params.id, {isActive: true}, {'new': true}).lean(), res, true);

    // Heat.findByIdAndUpdate(req.params.id, {isActive: true}, {'new': true})
    //     .populate({
    //         path: HEAT_POPULATE_PATH
    //     })
    //     .exec(function (err, heat) {
    //         if (err) {
    //             console.log(err);
    //             res.status(500).send(err);
    //         }
    //         else {
    //             populateHeatsWithDivisionsAndRespond(heat, res);
    //         }
    //     });
};

function removeActiveHeat (req, res) {
    return queryAndReturnResponse(Heat.findByIdAndUpdate(req.params.id, {isActive: false}, {'new': true}).lean(), res, true);

    // Heat.findByIdAndUpdate(req.params.id, {isActive: false})
    //     .populate({
    //         path: HEAT_POPULATE_PATH
    //     })
    //     .exec(function (err, heat) {
    //         if (err) {
    //             console.log(err);
    //             res.status(500).send(err);
    //         }
    //         else {
    //             populateHeatsWithDivisionsAndRespond(heat, res);
    //         }
    //     });
};



module.exports = router;
