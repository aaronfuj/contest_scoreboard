// app/models/rounds.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var roundSchema = mongoose.Schema({

  name     : { type: String, required: true },
  division : { type: mongoose.Schema.ObjectId, ref: 'Division', required: true }

});

roundSchema.statics.decorateQueryToPopulate = function (query) {
  return query
    .populate({
      path: 'division',
      model: 'Division'
    });
};


// create the model for rounds and expose it to our app
module.exports = mongoose.model('Round', roundSchema);
