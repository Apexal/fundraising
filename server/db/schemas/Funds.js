const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fundsSchema = new Schema({
    workshop: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop' },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, min: 0, required: true },
    method: { type: String, trim: true, required: true, maxlength: 20 },
    form: { type: String, enum: ['Cash', 'Check', 'Other'], default: 'Other' },
    source: { type: String, trim: true, maxlength: 20 },
    dateAdded: { type: Date, required: true }
});

module.exports = { name: 'Funds', schema: fundsSchema };