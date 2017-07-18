const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    _id: { type: Number },
    profileImageName: { type: String, default: 'default.png' },
    email: { type: String, unique: true },
    age: { type: Number, min: 10, max: 100 },
    grade: { type: Number, min: 8, max: 12 },
    phoneNumber: { type: String },
    location: { type: String },
    name: {
        first: { type: String, trim: true },
        last: { type: String, trim: true }
    },
    application: {
        recommender: { type: Number, ref: 'User' },
        why: String,
        writingFileName: String,
        role: String,
        camp: { type: mongoose.Schema.Types.ObjectId, ref: 'Camp' }
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

userSchema.methods.findCamps = function() {
    return this.model('Camp').find().or([{ ambassador: this._id }, { director: this._id}, { teachers: this._id }]).populate('location').exec();   
}

userSchema.virtual('name.full').get(function() { 
    return this.name.first + ' ' + this.name.last;
});

module.exports = { name: 'User', schema: userSchema };