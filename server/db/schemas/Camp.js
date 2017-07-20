const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');

const campSchema = new Schema({
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    teachers: [{ type: Number, ref: 'User' }],
    director: { type: Number, ref: 'User' },
    ambassador: { type: Number, ref: 'User' },
    info: {
        studentCount: { type: Number, min: 0, max: 100 },
        studentAgeRange: { type: String, trim: true },
        minTeachers: { type: Number, min: 0, max: 100 },
        classRoomAvailable: Boolean,
        contact: {
            name: { type: String, trim: true },
            contactInfo: { type: String, trim: true }
        },
        preparation: { type: String, trim: true },
        language: { type: String, trim: true, default: 'English' },
        extra: { type: String, trim: true }
    },
    dateAdded: { type: Date, required: true }
}, {
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true 
    }
});

campSchema.methods.findApplicants = function() {
    return this.model('User').find({ verified: false, 'application.camp': this._id }).exec();   
}

campSchema.methods.findFundraisingGoals = function() {
    return this.model('FundraisingGoal').find({ camp: this._id }).populate('submittedBy').exec();   
}

campSchema.virtual('ready').get(function() { 
    // Determine whether camp is ready to start
    return (this.teachers.length > 0 && !!this.director && !!this.ambassador);
});

campSchema.virtual('active').get(function() { 
    // Determine whether camp is going on right now
    return moment().isBefore(moment(this.endDate));
});

campSchema.virtual('ongoing').get(function() { 
    // Determine whether camp is going on right now
    return moment().isBetween(moment(this.startDate), moment(this.endDate));
});

// Remove funds related to camp
campSchema.pre('remove', function(next) {
    console.log('removing funds...');
    this.model('Funds').remove({ camp: this._id }, next);
});

module.exports = { name: 'Camp', schema: campSchema };