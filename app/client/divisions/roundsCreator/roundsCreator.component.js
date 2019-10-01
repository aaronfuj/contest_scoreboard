'use strict';

var _ = require('lodash');

var roundsCreator = {
  templateUrl: '/divisions/roundsCreator/roundsCreator.html',
  bindings: {
    user: '<',
    divisionId: "<",
    onRoundsAdded: '&'
  },
  controller: ['$q', 'roundService',
    function($q, roundService) {
      var ctrl = this;

      ctrl.createBulkRounds = function(bulkRoundNames) {

        if (bulkRoundNames == null || bulkRoundNames === undefined) {
          return;
        }

        console.log(bulkRoundNames);

        var validRoundNames = _.reduce(bulkRoundNames, function(result, potentialRoundName) {
          var validDivisionName = _.trim(potentialRoundName);

          if (validDivisionName) {
            result.push(validDivisionName);
          }

          return result;
        }, []);

        var roundCreationPromises = _.transform(validRoundNames, function(result, roundName) {
          result.push(roundService.createRound(ctrl.divisionId, roundName));
        }, []);


        if(roundCreationPromises.length > 0) {

          $q.all(roundCreationPromises).then(
            function (responses) {
              var newRounds = _.transform(responses, function(result, response) {
                result.push(response.data);
                return result;
              }, []);

              ctrl.onRoundsAdded({ rounds: newRounds });
              ctrl.bulkRoundNames = null;
            },
            function (error) {
              console.error(error);
            }
          );
        }
      };
    }
  ]
};

module.exports = roundsCreator;