const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    _id: { type: Number },
    profileImageName: { type: String, default: 'default.png' },
    email: { type: String, unique: true },
    phoneNumber: { type: String },
    currentCamp: { type: mongoose.Schema.Types.ObjectId, ref: 'Camp' },
    currentCamps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Camp' }],
    pastCamps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Camp' }],
    name: {
        first: { type: String, trim: true },
        last: { type: String, trim: true }
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

userSchema.virtual('name.full').get(function() { 
    return this.name.first + ' ' + this.name.last;
});

module.exports = { name: 'User', schema: userSchema };