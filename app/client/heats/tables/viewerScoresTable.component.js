'use strict';

var viewerScoresTable = {
  templateUrl: '/heats/tables/viewerScoresTable.html',
  bindings: {
    enableLeftRightRule: '<',
    judges: '<',
    tableScoresPerRider: '<',
    heatRider: '<'
  },
  controller: [ 'TabulationService',
    function(TabulationService) {
      var ctrl = this;
      ctrl.HIGH_SCORE_FIELD = TabulationService.HIGH_SCORE_FIELD;

      ctrl.getJudgeName = function(judge, index) {
        return 'Judge' + (index+1);
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

      ctrl.isValidScoreValue = function(value) {
        if(value === null || value === undefined) {
          return false;
        }
        else {
          return typeof value === 'number';
        }
      };
    }
  ]
};

module.exports = viewerScoresTable;