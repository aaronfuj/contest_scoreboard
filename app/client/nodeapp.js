'use strict';

var angular = require('angular');
var ngRoute = require('angular-route');

require('./vendor/rzslider/rzslider');
require('./vendor/sortablejs/Sortable');
require('./vendor/angular-legacy-sortable/angular-legacy-sortable');

// Declare app level module which depends on views, and components
angular.module('Scoreboard', [
  'ngRoute',
  'rzModule',
  'ng-sortable',
  'Scoreboard.clipboard',
  'Scoreboard.contestorder',
  'Scoreboard.divisions',
  'Scoreboard.rounds',
  'Scoreboard.heats',
  'Scoreboard.activeheats',
  'Scoreboard.riders',
  'Scoreboard.settings',
  'Scoreboard.scores',
  'Scoreboard.viewer'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/clipboard'});
}]).
run(['$window', '$rootScope', 'userService', 'headerService', 'settingsService',
  function ($window, $rootScope, userService, headerService, settingsService) {
    userService.setUserToScopeAsync($rootScope);
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

require('./clipboard');
require('./activeheats');
