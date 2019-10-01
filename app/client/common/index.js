'use strict';

var angular = require('angular');

var csLoader = require('./csLoader.component');
var csHeader = require('./csHeader.component');
var headerService = require('./headerService.service');
var timeService = require('./timeService.service');
var userService = require('./userService.service');

require('./header.css');

var app = angular.module('Scoreboard');

app
  .component('csLoader', csLoader)
  .component('csHeader', csHeader)
  .factory('headerService', headerService)
  .factory('timeService', timeService)
  .factory('userService', userService)
;

module.exports = app;
