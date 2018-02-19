const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');

const userSchema = new Schema({
    region: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', required: true },
    slackId: { type: String },
    profileImageName: { type: String, default: 'default.png' },
    email: { type: String, trim: true, unique: true, required: true, maxlength: 70 },
    age: { type: Number, min: 10, max: 19 },
    grade: { type: Number, min: 8, max: 12 },
    phoneNumber: { type: String, trim: true, maxlength: 20 },
    location: { type: String, trim: true, maxlength: 40 },
    name: {
        full: { type: String, required: true, trim: true },
        first: { type: String, required: true, trim: true },
        last: { type: String, required: true, trim: true }
    },
    rank: { type: 'String', enum: ['teacher', 'director', 'ambassador'] },
    application: {
        applying: { type: Boolean, default: true },
        rank: { type: 'String', default: 'teacher', enum: ['teacher', 'director', 'ambassador'] },
        superior: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        recommender: { type: String, trim: true, maxlength: 50},
        why: { type: String, trim: true, maxlength: 650 },
        writingFileName: { type: String, trim: true },
        updatedAt: { type: Date }
    },
    registeredDate: { type: Date, default: Date.now },
    admin: { type: Boolean, default: false },
    verified: { type: Boolean, default: false }
}, {
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true 
    }
});

userSchema.plugin(mongoosePaginate);

userSchema.pre('save', function(next) {
    this.name.full = this.name.first + ' ' + this.name.last;
    next();
});

userSchema.methods.getWorkshops = function() {
    return this.model('Workshop').find({ active: true }).or([{ ambassador: this._id }, { director: this._id}, { teachers: this._id }])
        .populate('location')
        .populate('ambassador')
        .populate('director')
        .populate('teachers')
        .exec();   
}

userSchema.virtual('rankName').get(function() { 
    return { teacher: 'Teacher', director: 'Program Director', ambassador: 'Ambassador' }[this.rank];
});

module.exports = { name: 'User', schema: userSchema };