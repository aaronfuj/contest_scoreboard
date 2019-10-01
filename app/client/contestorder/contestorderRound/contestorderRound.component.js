'use strict';

var _ = require('lodash');

var contestorderRound = {
  templateUrl: '/contestorder/contestorderRound/contestorderRound.html',
  bindings: {
    heats: '<',
    isAdmin: '<'
  },
  controller: ['$q', '$scope',
    function($q, $scope) {
      var ctrl = this;
      console.log(JSON.stringify(ctrl.heats));
    }
  ]
};

module.exports = contestorderRound;