const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    _id: { type: Number },
    email: { type: String, unique: true },
    phoneNumber: { type: String },
    currentCamp: { type: mongoose.Schema.Types.ObjectId, ref: 'Camp' },
    currentCamps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Camp' }],
    name: {
        first: { type: String, trim: true },
        last: { type: String, trim: true }
    },
    rank: { type: Number, default: 0 },
    registeredDate: { type: Date, default: Date.now },
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

userSchema.virtual('rankName').get(function() { 
    switch(this.rank) {
        case 0:
            return 'Teacher';
        case 1:
            return 'Program Director';
        case 2:
            return 'Ambassador';
        case 3:
            return 'Administrator';
    }
});

module.exports = { name: 'User', schema: userSchema };