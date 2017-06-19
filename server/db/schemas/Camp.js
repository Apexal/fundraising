const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const campSchema = new Schema({
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    info: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
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

module.exports = { name: 'Camp', schema: campSchema };