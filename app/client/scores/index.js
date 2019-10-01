'use strict';

var angular = require('angular');
var ScoreCtrl = require('./score.controller');
var scoreService = require('./scoreService.service');

require('./score.css');

var scoresModule = angular.module('Scoreboard.scores', ['ngRoute']);

scoresModule.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/scores/:id', {
      templateUrl: '/scores/score.html',
      controller: 'ScoreCtrl'
    });
}]);

scoresModule
  .controller('ScoreCtrl', ScoreCtrl)
  .factory('scoreService', scoreService)
;

module.exports = scoresModule;