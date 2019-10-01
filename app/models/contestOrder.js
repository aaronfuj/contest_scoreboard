// app/models/contestOrderSchema.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var contestOrderSchema = mongoose.Schema({

  rounds : [ { type: mongoose.Schema.ObjectId, ref: 'Round' } ]

});

contestOrderSchema.statics.decorateQueryToPopulate = function (query) {
  return query
    .populate({
      path: 'rounds',
      model: 'Round',
      populate: {
        path: 'division',
        model: 'Division'
      }
    });
};

// create the model for the contest order and expose it to our app
module.exports = mongoose.model('ContestOrder', contestOrderSchema);
