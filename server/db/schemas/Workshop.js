const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');
const mongoosePaginate = require('mongoose-paginate');

const workshopSchema = new Schema({
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    director: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ambassador: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    info: {
        studentCount: { type: Number, min: 0, max: 100, required: true },
        studentAgeRange: { type: String, trim: true, required: true, maxlength: 20 },
        teacherMin: { type: Number, min: 0, max: 100, required: true },
        classRoomAvailable: { type: Boolean, required: true },
        contact: {
            name: { type: String, trim: true, required: true, maxlength: 50 },
            contactInfo: { type: String, trim: true, required: true, maxlength: 50 }
        },
        preparation: { type: String, trim: true, maxlength: 250 },
        language: { type: String, trim: true, default: 'English', maxlength: 30 },
        extra: { type: String, trim: true, maxlength: 650 }
    },
    claimed: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
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

workshopSchema.virtual('ranksFilled').get(function() { 
    // Determine whether workshop is ready to start
    return (this.teachers.length > 1 && !!this.director && !!this.ambassador);
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