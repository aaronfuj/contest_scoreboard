// app/models/division.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var divisionSchema = mongoose.Schema({

  name     : String

});

// create the model for divisions and expose it to our app
module.exports = mongoose.model('Division', divisionSchema);
