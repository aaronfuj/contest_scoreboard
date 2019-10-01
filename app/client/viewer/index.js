'use strict';

var angular = require('angular');
var ViewerCtrl = require('./viewer.controller');

var viewerModule = angular.module('Scoreboard.viewer', [
  'ngRoute',
  'Scoreboard',
  'Scoreboard.heats',
  'Scoreboard.contestorder',
  'Scoreboard.settings']);

viewerModule.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/viewer', {
      templateUrl: '/viewer/viewer.html',
      controller: 'ViewerCtrl'
    });
}]);

viewerModule
  .controller('ViewerCtrl', ViewerCtrl);

module.exports = viewerModule;