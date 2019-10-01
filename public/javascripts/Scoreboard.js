'use strict';

// Declare app level module which depends on views, and components
angular.module('Scoreboard', [
  'ngRoute',
  'ngResource',
  'Scoreboard.clipboard',
  'Scoreboard.divisions',
  'Scoreboard.riders',
  'Scoreboard.Tabulation'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/clipboard'});
}]);
