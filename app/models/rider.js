// app/models/rider.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var riderSchema = mongoose.Schema({

  name      : String,
  divisions : [ { type: mongoose.Schema.ObjectId, ref: 'Division' } ]

});

// create the model for riders and expose it to our app
module.exports = mongoose.model('Rider', riderSchema);
