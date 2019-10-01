'use strict';

var angular = require('angular');
var SettingsCtrl = require('./settings.controller');
var settingsService = require('./settingsService.service');

require('./settings.css');

var settingsModule = angular.module('Scoreboard.settings', ['ngRoute', 'Scoreboard']);

settingsModule.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/settings', {
      templateUrl: '/settings/settings.html',
      controller: 'SettingsCtrl'
    });
}]);

settingsModule
  .controller('SettingsCtrl', SettingsCtrl)
  .factory('settingsService', settingsService);

module.exports = settingsModule;