const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const locationSchema = new Schema({
    name: { type: String, unique: true, required: true },
    address: { type: String, required: true }
});

userSchema.virtual('name.full').get(() => { 
    return this.name.first + ' ' + this.name.last;
});

module.exports = { name: 'Location', schema: locationSchema };