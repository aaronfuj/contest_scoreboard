var mongoose = require('mongoose');

// define the schema for our user model
var settingsSchema = mongoose.Schema({

      defaultWaveCount    : { type: Number, min: 0, max: 10, required: true },
      enableLeftRightRule : { type: Boolean, required: true },
      waveWindowSeconds   : { type: Number, min: 1, required: true },
      maxWaveCount        : { type: Number, required: true }

});

settingsSchema.statics.getSettingsPromise = function () {
      var settingsStatics = this;
      return new Promise(function (resolve, reject) {
            settingsStatics.findOne()
                .exec(function (err, settings) {
                      if (err) {
                            console.log(err);
                            reject(err);
                      }
                      else {
                            resolve(settings);
                      }
                });
      });
}

// create the model for scores and expose it to our app
module.exports = mongoose.model('Settings', settingsSchema);
