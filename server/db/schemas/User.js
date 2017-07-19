const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    _id: { type: Number },
    profileImageName: { type: String, default: 'default.png' },
    email: { type: String, trim: true, unique: true },
    age: { type: Number, min: 10, max: 100 },
    grade: { type: Number, min: 8, max: 12 },
    phoneNumber: { type: String, trim: true },
    location: { type: String, trim: true },
    name: {
        first: { type: String, trim: true, trim: true },
        last: { type: String, trim: true, trim: true }
    },
    application: {
        recommender: { type: Number, ref: 'User' },
        why: { type: String, trim: true },
        writingFileName: { type: String, trim: true },
        role: { type: String, trim: true },
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