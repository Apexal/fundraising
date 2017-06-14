const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const campSchema = new Schema({
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    ambassador: { type: Number, ref: 'User' },
    director: { type: Number, ref: 'User'}
});

campSchema.methods.getTeachers = function(cb) {
    return this.model('User').find({ location: this._id }).exec();
}

module.exports = { name: 'Camp', schema: campSchema };