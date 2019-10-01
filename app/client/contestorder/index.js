'use strict';

var angular = require('angular');


var contestorderRoundComponent = require('./contestorderRound/contestorderRound.component');

var ContestOrderCtrl = require('./contestorder.controller.js');
var ContestOrderEditCtrl = require('./contestorder-edit.controller.js');
var contestorderService = require('./contestorderService.service.js');

require('./contestorder.css');

var contestOrderModule = angular.module('Scoreboard.contestorder', [
  'ngRoute',
  'ng-sortable',
  'Scoreboard',
  'Scoreboard.rounds']);

contestOrderModule.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/contestorder', {
      templateUrl: '/contestorder/contestorder.html',
      controller: 'ContestOrderCtrl'
    })
    .when('/contestorder/edit', {
      templateUrl: '/contestorder/contestorder-edit.html',
      controller: 'ContestOrderEditCtrl'
    });
}]);

contestOrderModule
  .component('contestorderRoundComponent', contestorderRoundComponent)
  .controller('ContestOrderCtrl', ContestOrderCtrl)
  .controller('ContestOrderEditCtrl', ContestOrderEditCtrl)
  .service('contestorderService', contestorderService);

module.exports = contestOrderModule;