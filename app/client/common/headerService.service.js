'use strict';

function headerService () {

  var savedCtrlScope;

  var init = function(scope) {
    savedCtrlScope = scope;
  };

  var updateHeader = function(headerValue) {
    if(savedCtrlScope) {
      savedCtrlScope.headerValue = headerValue;
      savedCtrlScope.clicked = false;
    }
  };

  return {
    init: init,
    updateHeader: updateHeader
  };
}

module.exports = headerService;