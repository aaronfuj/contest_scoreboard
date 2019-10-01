'use strict';

var csHeader = {
  templateUrl: '/common/csHeader.html',
  bindings: {
    // headerValue: '<',
    // subHeaderValue: '<',
    // user: '<'
  },
  controller: ['$scope', 'headerService', 'divisionService', 'userService',
    function ($scope, headerService, divisionService, userService) {
      var ctrl = this;
      userService.getUser().then(
        function(user) {
          ctrl.user = user;
        });

      headerService.init($scope);
      headerService.updateHeader('Contest Scoreboard');

      divisionService.getAllDivisions().then(
        function (response) {
          ctrl.divisions = _.orderBy(response.data, ['_id'], ['desc']);
        }
      );

      ctrl.setClicked = function (clicked) {
        ctrl.clicked = clicked;
      };
    }
  ]
};

module.exports = csHeader;