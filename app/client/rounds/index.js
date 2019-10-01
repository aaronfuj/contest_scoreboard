'use strict';

var angular = require('angular');
var SingleRoundCtrl = require('./round.controller');
var roundService = require('./roundService.service');

require('./rounds.css');

var roundsModule = angular.module('Scoreboard.rounds', [
  'ngRoute',
  'Scoreboard.heats'
]);

roundsModule.config(['$routeProvider', function ($routeProvider) {
  $routeProvider
    .when('/rounds/:id', {
      templateUrl: '/rounds/singleRound.html',
      controller: 'SingleRoundCtrl'
    });
}]);

roundsModule
  .controller('SingleRoundCtrl', SingleRoundCtrl)
  .factory('roundService', roundService)
;

module.exports = roundsModule;