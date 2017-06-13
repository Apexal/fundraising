const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    _id: { type: Number },
    email: { type: String, unique: true },
    phoneNumber: { type: String, unique: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    name: {
        first: { type: String, trim: true },
        last: { type: String, trim: true }
    },
    rank: { type: Number, default: 0 },
    registeredDate: { type: Date, default: Date.now },
    superior: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    accountStatus: { type: Number, default: 0 }
});

userSchema.virtual('name.full').get(() => { 
    return this.name.first + ' ' + this.name.last;
});

module.exports = { name: 'User', schema: userSchema };