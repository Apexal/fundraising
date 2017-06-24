const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fundsSchema = new Schema({
    camp: { type: mongoose.Schema.Types.ObjectId, ref: 'Camp' },
    submittedBy: { type: Number, ref: 'User', required: true },
    amount: { type: Number, min: 0, required: true },
    method: { type: String, required: true },
    form: { type: String, enum: ['Cash', 'Check', 'Other'], default: 'Other' },
    source: String,
    addedAt: { type: Date, required: true }
});

module.exports = { name: 'Funds', schema: fundsSchema };