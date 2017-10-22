const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');

const locationSchema = new Schema({
    name: { type: String, trim: true, unique: true, required: true },
    address: { type: String, trim: true, unique: true, required: true },
    description: { type: String, trim: true },
    dateAdded: { type: Date, required: true }
});

locationSchema.plugin(mongoosePaginate);

locationSchema.methods.getWorkshops = function() {
    return this.model('Workshop').find({ location: this._id })
        .populate('location')
        .populate('ambassador')
        .populate('director')
        .populate('teachers')
        .exec();   
}

// Remove workshops at location
locationSchema.pre('remove', function(next) {
    console.log('removing workshops...');
    
    // Delete one at a time so Fund data is also deleted
    this.findWorkshops()
        .then(workshops => {
            workshops.forEach(w => w.remove());
            next();
        })
        .catch(next);
});

module.exports = { name: 'Location', schema: locationSchema };
