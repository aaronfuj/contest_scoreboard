'use strict';

var angular = require('angular');

var heatControl = require('./heatControl/heatControl.component');
var heatView = require('./heatView/heatView.component');
var heatViewLiveHeader = require('./heatView/heatViewLiveHeader.component');
var heatViewResultHeader = require('./heatView/heatViewResultHeader.component');
var allScoresTable = require('./tables/allScoresTable.component');
var viewerScoresTable = require('./tables/viewerScoresTable.component');
var timerControl = require('./timer/timerControl.component');
var heatDisplay = require('./heatDisplay.component');
var SingleHeatCtrl = require('./heat.controller');
var heatService = require('./heatService.service');
var colorService = require('./colorService.service');
var calculationService = require('./calculationService.service');

require('./heats.css');
require('./heat-switch.css');

require('./heatDisplay.css');

var heatsModule = angular.module('Scoreboard.heats', [
  'ngRoute',
  'Scoreboard.settings',
  'Scoreboard.contestorder',
  'Scoreboard.Tabulation']);

heatsModule.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/heats/:id/edit', {
      templateUrl: '/heats/editHeat.html',
      controller: 'SingleHeatCtrl'
    })
    .when('/heats/:id', {
      templateUrl: '/heats/displayHeat.html',
      controller: 'SingleHeatCtrl'
    });
}]);

heatsModule
  .component('heatControl', heatControl)
  .component('heatView', heatView)
  .component('heatViewLiveHeader', heatViewLiveHeader)
  .component('heatViewResultHeader', heatViewResultHeader)
  .component('allScoresTable', allScoresTable)
  .component('viewerScoresTable', viewerScoresTable)
  .component('timerControl', timerControl)
  .component('heatDisplay', heatDisplay)
  .controller('SingleHeatCtrl', SingleHeatCtrl)
  .factory('heatService', heatService)
  .factory('colorService', colorService)
  .factory('calculationService', calculationService)
  ;

module.exports = heatsModule;