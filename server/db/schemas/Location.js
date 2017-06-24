const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const locationSchema = new Schema({
    name: { type: String, unique: true, required: true },
    address: { type: String, unique: true, required: true },
    description: String
});

locationSchema.methods.findCamps = function() {
    return this.model('Camp').find({ location: this._id }).exec();   
}

// Remove camps at location
locationSchema.pre('remove', function(next) {
    console.log('removing camps...');
    this.model('Camp').remove({ location: this._id }, next);
});

module.exports = { name: 'Location', schema: locationSchema };
