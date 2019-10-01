var _ = require('lodash');

var socketIoInstance;
var heatIdToTimerObject = {};

var TIMER_GROUP = 'heat:timer';
var SCORES_GROUP = 'heat:scores';
var ACTIVE_HEAT_GROUP = 'heat:active';
var SETTINGS_GROUP = 'settings';

var HEAT_UPDATE_EVENT = 'heat:update';
var SCORE_UPDATE_EVENT = 'score:update';
var SCORE_MODIFIED_EVENT = 'score:modified';
var TIMER_EVENT = 'timer';
var SETTINGS_UPDATE_EVENT = 'settings:update';

var SET_TIMER_EVENT = 'heat:timer:set';
var START_TIMER_EVENT = 'heat:timer:start';
var PAUSE_TIMER_EVENT = 'heat:timer:pause';
var STOP_TIMER_EVENT = 'heat:timer:stop';

var getInstance = function() {
  return socketIoInstance;
};

var startCounter = function(heatTimerTracker) {
  if(!heatTimerTracker.secondsCounter) {
    heatTimerTracker.secondsCounter = heatTimerTracker.timeSeconds;
  }

  if(heatTimerTracker.counter) {
    stopCounter(heatTimerTracker);
  }

  emitTimerUpdate(heatTimerTracker);

  heatTimerTracker.counter = setInterval(function() {
    heatTimerTracker.secondsCounter--;
    emitTimerUpdate(heatTimerTracker);
  }, 1000);
};

var emitTimerUpdate = function(heatTimerTracker) {
  socketIoInstance.to(TIMER_GROUP).emit(TIMER_EVENT, {
    heatId: heatTimerTracker.heatId,
    maxTime: heatTimerTracker.timeSeconds,
    secondsLeft: heatTimerTracker.secondsCounter
  });
};

var pauseCounter = function(heatTimerTracker) {
  stopCounter(heatTimerTracker);
};

var stopAndResetCounter = function(heatTimerTracker) {
  stopCounter(heatTimerTracker);
  heatTimerTracker.secondsCounter = heatTimerTracker.timeSeconds;
  emitTimerUpdate(heatTimerTracker);
};

var stopCounter = function(heatTimerTracker) {
  if(heatTimerTracker.counter) {
    console.log("Stopping counter");
    clearInterval(heatTimerTracker.counter);
    delete heatTimerTracker.counter;
  }
};

var initializeSocketLibrary = function(io) {
  socketIoInstance = io;

  socketIoInstance.on('connection', function (socket) {
    console.log("Socket.io received a connection from: " + socket.id);
    socket.emit('news', { hello: 'world' });

    socket.on('score', function (data) {
      console.log(data);
    });

    socket.on('heat:timer:set', function (data) {
      console.log("Setting timer");
      console.log(data);

      heatIdToTimerObject[data.heatId] = heatIdToTimerObject[data.heatId] || {};
      _.assign(heatIdToTimerObject[data.heatId], data);

      emitTimerUpdate(heatIdToTimerObject[data.heatId]);
    });

    socket.on('heat:timer:start', function(data) {
      console.log("Starting timer");
      console.log(data);

      if(data.heatId) {
        heatIdToTimerObject[data.heatId] = heatIdToTimerObject[data.heatId] || {
            heatId: data.heatId,
            timeSeconds: 10*60
          };
        startCounter(heatIdToTimerObject[data.heatId]);
      }
    });

    socket.on('heat:timer:pause', function(data) {
      console.log("Pausing timer");
      console.log(data);
      if(data.heatId && heatIdToTimerObject[data.heatId]) {
        pauseCounter(heatIdToTimerObject[data.heatId]);
      }
    });

    socket.on('heat:timer:stop', function(data) {
      console.log("Stopping timer");
      console.log(data);

      if(data.heatId && heatIdToTimerObject[data.heatId]) {
        stopAndResetCounter(heatIdToTimerObject[data.heatId]);
      }
    });

    socket.join(TIMER_GROUP);
    socket.join(SCORES_GROUP);
    socket.join(ACTIVE_HEAT_GROUP);
    socket.join(SETTINGS_GROUP);
  });
};

module.exports = {
  TIMER_GROUP: TIMER_GROUP,
  SCORES_GROUP: SCORES_GROUP,
  ACTIVE_HEAT_GROUP: ACTIVE_HEAT_GROUP,
  SETTINGS_GROUP: SETTINGS_GROUP,

  SETTINGS_UPDATE_EVENT: SETTINGS_UPDATE_EVENT,
  HEAT_UPDATE_EVENT: HEAT_UPDATE_EVENT,

  SCORE_UPDATE_EVENT: SCORE_UPDATE_EVENT,
  SCORE_MODIFIED_EVENT: SCORE_MODIFIED_EVENT,

  initialize: initializeSocketLibrary,
  getInstance: getInstance
};