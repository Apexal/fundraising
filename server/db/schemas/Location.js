const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const locationSchema = new Schema({
    name: { type: String, unique: true, required: true },
    address: { type: String, unique: true, required: true },
    description: String,
    dateAdded: { type: Date, required: true }
});

locationSchema.methods.findCamps = function() {
    return this.model('Camp').find({ location: this._id })
        .populate('location')
        .populate('ambassador')
        .populate('director')
        .populate('teachers')
        .exec();   
}

// Remove camps at location
locationSchema.pre('remove', function(next) {
    console.log('removing camps...');
    
    // Delete one at a time so Fund data is also deleted
    //this.model('Camp').remove({ location: this._id }, next);
    this.findCamps()
        .then(camps => {
            camps.forEach(c => c.remove());
            next();
        })
        .catch(next);
});

module.exports = { name: 'Location', schema: locationSchema };
