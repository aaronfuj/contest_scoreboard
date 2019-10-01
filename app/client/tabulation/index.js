'use strict';

var angular = require('angular');

var TabulationService = require('../../../public/javascripts/tabulation');

var tabulationModule = angular.module('Scoreboard.Tabulation', []);


tabulationModule.factory('TabulationService', TabulationService);

module.exports = tabulationModule;