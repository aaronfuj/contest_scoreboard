'use strict';

var angular = require('angular');
var ngRoute = require('angular-route');

require('./vendor/sortablejs/Sortable');
require('./vendor/angular-legacy-sortable/angular-legacy-sortable');

// Declare app level module which depends on views, and components
angular.module('Scoreboard', [
  'ngRoute',
  'ng-sortable',
  'Scoreboard.contestorder',
  'Scoreboard.divisions',
  'Scoreboard.riders',
  'Scoreboard.rounds',
  'Scoreboard.heats',
  'Scoreboard.riders',
  'Scoreboard.settings',
  'Scoreboard.scores',
  'Scoreboard.viewer'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/viewer'});
}]).
run([ '$window', '$rootScope', '$location', 'settingsService',
  function ($window, $rootScope, $location, settingsService) {
  settingsService.getSettingsPromise();
}]);

require('./common');
require('./tabulation');
require('./contestorder');
require('./divisions');
require('./rounds');
require('./heats');
require('./riders');
require('./settings');
require('./scores');
require('./socket');
require('./viewer/index');