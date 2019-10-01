'use strict';

var angular = require('angular');
var socket = require('./socketService.service');

var app = angular.module('Scoreboard');
app.factory('socket', socket);

module.exports = app;