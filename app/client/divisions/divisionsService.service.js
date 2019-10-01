'use strict';

DivisionService.$inject = ['$http'];

function DivisionService($http) {
    var getAllDivisions = function() {
        return $http.get('/api/divisions');
    };

    var getDivision = function(divisionId) {
       return $http.get('/api/divisions/' + divisionId);
    };

    var createDivision = function(divisionName) {
        var division = {
            name: divisionName
        };
        return $http.post("/api/divisions", division);
    };

    var deleteDivision = function(divisionId) {
        return $http.delete('/api/divisions/' + divisionId);
    };

    return {
        getAllDivisions: getAllDivisions,
        getDivision: getDivision,
        createDivision: createDivision,
        deleteDivision: deleteDivision
    };
}

module.exports = DivisionService;
