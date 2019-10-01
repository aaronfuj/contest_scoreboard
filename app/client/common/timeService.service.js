'use strict';

function timeService() {
  function str_pad_left(string, pad, length) {
    return (new Array(length + 1).join(pad) + string).slice(-length);
  }

  var createMinutesSecondsString = function (secondsValue) {
    var isNegative = secondsValue < 0;
    if (isNegative) {
      secondsValue = -secondsValue;
    }

    var minutes = Math.floor(secondsValue / 60);
    var seconds = secondsValue - minutes * 60;
    var finalTime = str_pad_left(minutes, '0', 2) + ':' + str_pad_left(seconds, '0', 2);

    if (isNegative) {
      finalTime = '-' + finalTime;
    }

    return finalTime;
  };

  return {
    createMinutesSecondsString: createMinutesSecondsString
  };
}

module.exports = timeService;