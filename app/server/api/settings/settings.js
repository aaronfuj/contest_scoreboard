'use strict';

var express = require('express');
var Settings = require('../../../models/settings');

var Permissions = require('../../../server/permissions.js');

var SocketFactory = require('../../../server/socket.js');
var router = express.Router();

router.get('/', getAllSettings);
router.put('/', Permissions.isAdmin, updateSettings);

function sendSettingsToSockets(settings) {
    var socketIo = SocketFactory.getInstance();
    socketIo.to(SocketFactory.SETTINGS_GROUP).emit(SocketFactory.SETTINGS_UPDATE_EVENT, { settings: settings });
}

function getAllSettings(req, res) {
    Settings.findOne()
        .exec(function (err, settings) {
            if (err) {
                console.log(err);
                res.status(400).send(err);
            }
            else {
                if(settings) {
                    res.json(settings);
                }
                else {

                    // If no settings exists by default, then create one
                    var newSettings = new Settings({
                        defaultWaveCount    : 3,
                        enableLeftRightRule : false,
                        waveWindowSeconds   : 30,
                        maxWaveCount        : -1
                    });
                    newSettings.save(function (err, result, numAffected) {
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
}


function updateSettings(req, res) {
    Settings.findOne()
        .exec(function (err, settings) {
            if (err) {
                console.log(err);
                res.status(400).send(err);
            }
            else {

                // Update existing settings if it exists
                if (settings) {
                    settings.defaultWaveCount = req.body.defaultWaveCount;
                    settings.enableLeftRightRule = req.body.enableLeftRightRule;
                    settings.waveWindowSeconds = req.body.waveWindowSeconds;
                    settings.maxWaveCount = req.body.maxWaveCount;

                    settings.save(function (err) {
                        if (err) {
                            console.log(err);
                            res.status(400).send(err);
                        }
                        else {
                            sendSettingsToSockets(settings.toObject());
                            res.json(settings);
                        }
                    });
                }
                else {

                    // If no settings object exists, create a new one
                    var settingsRequest = req.body;
                    var newSettings = new Settings(settingsRequest);
                    newSettings.save(function (err, result, numAffected) {
                        if (err) {
                            console.log(err);
                            res.status(400).send(err);
                        }
                        else {
                            sendSettingsToSockets(result.toObject());
                            res.json(result);
                        }
                    });
                }

            }
        });
}

module.exports = router;
