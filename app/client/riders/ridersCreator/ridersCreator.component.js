'use strict';

var _ = require('lodash');

var ridersCreator = {
  templateUrl: '/riders/ridersCreator/ridersCreator.html',
  bindings: {
    user: '<',
    divisions: '<',
    selectedDivision: '<',
    onRidersAdded: '&'
  },
  controller: ['$q', 'riderService',
    function($q, riderService) {
      var ctrl = this;


      ctrl.createBulkRiders = function (division, bulkRiderNames) {
        if (bulkRiderNames == null || bulkRiderNames === undefined) {
          return;
        }

        console.log(bulkRiderNames);

        var validRiderNames = _.reduce(bulkRiderNames, function(result, potentialRiderName) {
          var validRiderName = _.trim(potentialRiderName);

          if (validRiderName) {
            result.push(validRiderName);
          }

          return result;
        }, []);

        var riderCreationPromises = _.transform(validRiderNames, function(result, riderName) {
          result.push(riderService.createRider(riderName, division._id));
        }, []);


        if(riderCreationPromises.length > 0) {

          $q.all(riderCreationPromises).then(
            function (responses) {
              var addedRiders = _.transform(responses, function(result, response) {
                result.push(response.data);
                return result;
              }, []);

              ctrl.onRidersAdded(
                {
                  division: division,
                  riders: addedRiders
                }
              );
              ctrl.bulkRiderNames = "";
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

module.exports = ridersCreator;