const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');
const mongoosePaginate = require('mongoose-paginate');

const workshopSchema = new Schema({
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    teachers: [{ type: Number, ref: 'User' }],
    director: { type: Number, ref: 'User' },
    ambassador: { type: Number, ref: 'User' },
    info: {
        studentCount: { type: Number, min: 0, max: 100, required: true },
        studentAgeRange: { type: String, trim: true, required: true },
        teacherMin: { type: Number, min: 0, max: 100, required: true },
        classRoomAvailable: { type: Boolean, required: true },
        contact: {
            name: { type: String, trim: true, required: true },
            contactInfo: { type: String, trim: true, required: true }
        },
        preparation: { type: String, trim: true },
        language: { type: String, trim: true, default: 'English' },
        extra: { type: String, trim: true }
    },
    claimed: { type: Boolean, default: false },
    dateAdded: { type: Date, required: true }
}, {
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true 
    }
});

workshopSchema.plugin(mongoosePaginate);

workshopSchema.methods.findApplicants = function() {
    return this.model('User').find({ verified: false, 'application.workshop': this._id }).exec();   
}

workshopSchema.methods.findFundraisingGoals = function() {
    return this.model('FundraisingGoal').find({ workshop: this._id }).populate('submittedBy').exec();   
}

workshopSchema.virtual('ready').get(function() { 
    // Determine whether workshop is ready to start
    return (this.teachers.length > 0 && !!this.director && !!this.ambassador);
});

workshopSchema.virtual('active').get(function() { 
    // Determine whether workshop is going on right now
    return moment().isBefore(moment(this.endDate));
});

workshopSchema.virtual('ongoing').get(function() { 
    // Determine whether workshop is going on right now
    return moment().isBetween(moment(this.startDate), moment(this.endDate));
});

// Remove funds related to workshop
workshopSchema.pre('remove', function(next) {
    console.log('removing funds...');
    this.model('Funds').remove({ workshop: this._id }, next);
});

module.exports = { name: 'Workshop', schema: workshopSchema };