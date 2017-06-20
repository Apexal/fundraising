const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');

const campSchema = new Schema({
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    info: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
}, {
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true 
    }
});

campSchema.methods.getTeachers = function() {
    console.log('Getting teachers for ...' + this._id);
    return this.model('User').find({ rank: 0, currentCamp: this._id }).exec();
}

campSchema.methods.getDirector = function() {
    console.log('Getting director...');
    return this.model('User').findOne({ rank: 1, currentCamp: this._id }).exec();
}

campSchema.methods.getAmbassador = function() {
    console.log('Getting ambassador...');
    return this.model('User').findOne({ rank: 2, currentCamps: this._id }).exec();
}

campSchema.virtual('active').get(function() { 
    // Determine whether camp is going on right now
    return moment().isBetween(moment(self.startDate), moment(self.endDate));
});

module.exports = { name: 'Camp', schema: campSchema };