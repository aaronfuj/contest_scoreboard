'use strict';

var angular = require('angular');

var riderScoreEntry = require('./entry/riderScoreEntry.component');
var ClipboardCtrl = require('./clipboard.controller');

require('./clipboard.css');

var clipboardModule = angular.module('Scoreboard.clipboard', [
  'ngRoute',
  'Scoreboard',
  'Scoreboard.heats',
  'Scoreboard.settings',
  'Scoreboard.scores']);

clipboardModule.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/clipboard', {
    templateUrl: '/clipboard/clipboard.html',
    controller: 'ClipboardCtrl'
  });
}]);

clipboardModule
  .component('riderScoreEntry', riderScoreEntry)
  .controller('ClipboardCtrl', ClipboardCtrl)
;

module.exports = clipboardModule;