'use strict';

var angular = require('angular');
var RidersCtrl = require('./riders.controller');
var riderService = require('./riderService.service');

var RidersCreatorComponent = require('./ridersCreator/ridersCreator.component');

require('./riders.css');

var ridersModule = angular.module('Scoreboard.riders', [
  'ngRoute', 
  'Scoreboard.divisions']);

ridersModule.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/riders', {
      templateUrl: '/riders/riders.html',
      controller: 'RidersCtrl'
    });
  }]);

ridersModule
  .component('ridersCreator', RidersCreatorComponent)
  .controller('RidersCtrl', RidersCtrl)
  .factory('riderService', riderService)
;

module.exports = ridersModule;