// app/models/score.js
// load the things we need
var mongoose = require('mongoose');
var _ = require('lodash');

// define the schema for our user model
var scoreSchema = mongoose.Schema({

      judge            : { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
      heat             : { type: mongoose.Schema.ObjectId, ref: 'Heat', required: true },
      rider            : { type: mongoose.Schema.ObjectId, ref: 'Rider', required: true },
      waveNumber       : Number, // This should be unique per heat/rider
      direction        : String,
      time             : { type: Date, default: Date.now },
      value            : { type: Number, min: 0, max: 10, required: true },
      isInterference   : { type: Boolean, default: false },
      interferenceType : String // 'minor' or 'major'

});

scoreSchema.statics.createHeatsWithScoresPromise = function (heats) {
  console.log('create heat with scores');

  var heatIds = _.transform(heats, function (result, heat) {
    console.log(heat._id);
    result.push(heat._id);
    return result;
  }, []);

  console.log('heat ids', heatIds);

  var scoreModel = this;
  return new Promise(function(resolve, reject) {
    // Get all of the scores for all of the heats
    // TODO: Abstract this out better since its used in the Heat API
    scoreModel.find({heat: {$in: heatIds}})
      .populate({
        path: 'judge',
        select: 'local.username'
      })
      .exec(function (err, scores) {
        if (err) {
          console.log(err);
          reject(err);
        }
        else {

          console.log('scores');

          // Fill in each heat with the scores that are associated with it
          var filledInHeats = _.transform(scores, function (result, score) {
            var scoreArray = result[score.heat] || (result[score.heat] = []);
            scoreArray.push(score);
            return result;
          }, {});


          var heatsWithScores = _.transform(heats, function (result, heat) {
            var heatObject = heat.toObject();
            heatObject.scores = filledInHeats[heatObject._id];
            result.push(heatObject);
            return result;
          }, []);

          resolve(heatsWithScores);
        }
      });
  });
};

// create the model for scores and expose it to our app
module.exports = mongoose.model('Score', scoreSchema);
