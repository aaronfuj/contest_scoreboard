'use strict';

var angular = require('angular');

var ActiveHeatsCtrl = require('./activeheats.controller');

require('./activeheats.css');

var activeHeatsModule = angular.module('Scoreboard.activeheats', [
  'ngRoute',
  'Scoreboard',
  'Scoreboard.contestorder'
]);

activeHeatsModule.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/activeheats', {
      templateUrl: '/activeheats/activeheats.html',
      controller: 'ActiveHeatsCtrl'
    });
}]);

activeHeatsModule
  .controller('ActiveHeatsCtrl', ActiveHeatsCtrl);

module.exports = activeHeatsModule;