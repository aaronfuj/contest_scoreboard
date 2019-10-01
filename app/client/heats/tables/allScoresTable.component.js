'use strict';

var allScoresTable = {
  templateUrl: '/heats/tables/allScoresTable.html',
  bindings: {
    enableLeftRightRule: '<',
    judges: '<',
    tableScoresPerRider: '<',
    heatRider: '<',
    isAdmin: '<'
  },
  controller: [ 'TabulationService',
    function(TabulationService) {
      var ctrl = this;
      ctrl.HIGH_SCORE_FIELD = TabulationService.HIGH_SCORE_FIELD;

      ctrl.getJudgeName = function(judge, index) {
        return ctrl.isAdmin ? judge.name : 'Judge' + index;
      };

      ctrl.getViewableTableScores = function() {
        var tableScoresForRider = ctrl.tableScoresPerRider[ctrl.heatRider.rider._id];
        return tableScoresForRider;
      };

      ctrl.parseDirection = function(direction) {
        if(direction == TabulationService.LEFT) {
          return 'L';
        }
        else if(direction == TabulationService.RIGHT) {
          return 'R';
        }
        else {
          return direction;
        }
      };
    }
  ]
};

module.exports = allScoresTable;