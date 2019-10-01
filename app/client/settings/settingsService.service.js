'use strict';

var _ = require('lodash');

settingsService.$inject = ['$http'];

function settingsService($http) {

    var enableLeftRightRule = true;
    var cachedSettings = {};


    var settings = {

      getCachedSettings: function() {
        return cachedSettings;
      },

      isLeftRightRuleEnabled: function() {
        return enableLeftRightRule;
      },

      getSettingsPromise: function() {
        var settingsPromise = $http.get('/api/settings/');
        settingsPromise.then(function(response) {
          enableLeftRightRule = response.data.enableLeftRightRule;
          cachedSettings = _.assign({}, response.data);
        });
        return settingsPromise;
      },

      setSettings: function(settings) {
        var settingsPromise = $http.put('/api/settings', settings);
        settingsPromise.then(function(response) {
          enableLeftRightRule = response.data.enableLeftRightRule;
          cachedSettings = _.assign({}, response.data);
        });
        return settingsPromise;
      }
    };

    return settings;
}

module.exports = settingsService;
