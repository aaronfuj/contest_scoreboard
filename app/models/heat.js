// app/models/heat.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var heatSchema = mongoose.Schema({

    name: { type: String, required: true},
    round: {type: mongoose.Schema.ObjectId, ref: 'Round', required: true},
    riders: [{

        rider: {type: mongoose.Schema.ObjectId, ref: 'Rider', required: true},
        color: String

    }],
    isActive: {type: Boolean, default: false}

});

heatSchema.statics.decorateQueryToPopulate = function (query) {
    return query
        .populate({
            path: 'round',
            model: 'Round',
            populate: {
                path: 'division',
                model: 'Division'
            }
        })
        .populate({
            path: 'riders.rider'
        });
};

heatSchema.statics.populateRoundDivisions = function (heats, cb) {
    var options = {
        path: 'round.division',
        model: 'Division'
    };

    return this.populate(heats, options, cb);
};

// create the model for heats and expose it to our app
module.exports = mongoose.model('Heat', heatSchema);
