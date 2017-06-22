const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');

const campSchema = new Schema({
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    info: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    teachers: [{ type: Number, ref: 'User' }],
    director: { type: Number, ref: 'User' },
    ambassador: { type: Number, ref: 'User' }
}, {
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true 
    }
});

campSchema.virtual('ready').get(function() { 
    // Determine whether camp is ready to start
    return (this.teachers.length > 0 && !!this.director && !!this.ambassador);
});

campSchema.virtual('active').get(function() { 
    // Determine whether camp is going on right now
    return moment().isBetween(moment(this.startDate), moment(this.endDate));
});

module.exports = { name: 'Camp', schema: campSchema };