'use strict';

var _ = require('lodash');

var HeatResultComponent = {
  templateUrl: '/divisions/heatResult.html',
  bindings: {
    heat: '<',
    topResults: '<',
    riderRanks: '<',
    isAdmin: '<',
    showHeader: '<'
  },
  controller:
    function() {
      var ctrl = this;

      ctrl.getTotalScoreForRider = function(heatId, riderId) {
        if(ctrl.topResults) {
          var foundResult = _.find(ctrl.topResults, function(topResult) {
            return riderId == topResult.heatRider.rider._id;
          });

          if(foundResult) {
            return foundResult.total;
          }
          else {
            return 'N/A';
          }
        }
        else {
          return 'N/A';
        }
      };

      ctrl.getRiderRank = function(heatId, riderId) {
        if(ctrl.riderRanks) {
          var rank = ctrl.riderRanks.riderIdToRank[riderId];
          return rank || 'N/A';
        }
        else {
          return 'N/A'
        }
      };
    }
};

module.exports = HeatResultComponent;