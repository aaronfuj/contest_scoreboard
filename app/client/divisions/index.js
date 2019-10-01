'use strict';

var angular = require('angular');
var ngRoute = require('angular-route');
var ngTouch = require('angular-touch');

var HeatResultComponent = require('./heatResult.component');
var SingleDivisionCtrl = require('./division.controller');
var AllDivisionsCtrl = require('./divisions.controller');
var divisionsService = require('./divisionsService.service');
var DivisionsCreatorComponent = require('./divisionsCreator/divisionsCreator.component');
var RoundsCreatorComponent = require('./roundsCreator/roundsCreator.component');

require('./divisions.css');
require('./heat-result.css');

var divisionsModule = angular.module('Scoreboard.divisions', ['ngRoute', 'ngTouch', 'Scoreboard']);

divisionsModule.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/divisions', {
      templateUrl: '/divisions/divisions.html',
      controller: 'DivisionsCtrl'
    })
    .when('/divisions/:id', {
      templateUrl: '/divisions/division.html',
      controller: 'SingleDivisionCtrl'
    });
}]);

divisionsModule
  .component('heatResult', HeatResultComponent)
  .component('divisionsCreator', DivisionsCreatorComponent)
  .component('roundsCreator', RoundsCreatorComponent)
  .controller('SingleDivisionCtrl', SingleDivisionCtrl)
  .controller('DivisionsCtrl', AllDivisionsCtrl)
  .service('divisionService', divisionsService);

module.exports = divisionsModule;