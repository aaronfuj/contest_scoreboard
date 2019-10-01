'use strict';

var _ = require('lodash');

var divisionsCreator = {
  templateUrl: '/divisions/divisionsCreator/divisionsCreator.html',
  bindings: {
    user: '<',
    onDivisionsAdded: '&'
  },
  controller: ['$q', 'divisionService',
    function($q, divisionService) {
      var ctrl = this;

      ctrl.createBulkDivisions = function(bulkDivisionNames) {

        if (bulkDivisionNames == null || bulkDivisionNames === undefined) {
          return;
        }

        console.log(bulkDivisionNames);

        var validDivisionNames = _.reduce(bulkDivisionNames, function(result, potentialDivisionName) {
          var validDivisionName = _.trim(potentialDivisionName);

          if (validDivisionName) {
            result.push(validDivisionName);
          }

          return result;
        }, []);

        var divisionCreationPromises = _.transform(validDivisionNames, function(result, divisionName) {
          result.push(divisionService.createDivision(divisionName));
        }, []);


        if(divisionCreationPromises.length > 0) {

          $q.all(divisionCreationPromises).then(
            function (responses) {
              var newDivisions = _.transform(responses, function(result, response) {
                result.push(response.data);
                return result;
              }, []);

              ctrl.onDivisionsAdded({ divisions: newDivisions });
              ctrl.bulkDivisionNames = null;
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

module.exports = divisionsCreator;