const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');

const userSchema = new Schema({
    slackId: { type: String },
    profileImageName: { type: String, default: 'default.png' },
    email: { type: String, trim: true, unique: true, required: true },
    age: { type: Number, min: 10, max: 100 },
    grade: { type: Number, min: 8, max: 12 },
    phoneNumber: { type: String, trim: true },
    location: { type: String, trim: true },
    name: {
        full: { type: String, required: true, trim: true },
        first: { type: String, required: true, trim: true },
        last: { type: String, required: true, trim: true }
    },
    rank: { type: 'String', enum: ['teacher', 'director', 'ambassador'] },
    application: {
        rank: { type: 'String', enum: ['teacher', 'director', 'ambassador'] },
        superior: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        recommender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        why: { type: String, trim: true },
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
    return this.model('Workshop').find({ active: true }).or([{ ambassador: this._id }, { director: this._id}, { teachers: this._id }]).populate('location').exec();   
}

userSchema.virtual('rankName').get(function() { 
    return { teacher: 'Teacher', director: 'Program Director', ambassador: 'Ambassador' }[this.rank];
});

module.exports = { name: 'User', schema: userSchema };