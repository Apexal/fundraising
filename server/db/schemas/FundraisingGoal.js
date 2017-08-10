const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fundraisingGoalSchema = new Schema({
    workshop: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop' },
    submittedBy: { type: Number, ref: 'User', required: true },
    amount: { type: Number, min: 0, required: true },
    deadline: { type: Date, required: true },
    dateAdded: { type: Date, required: true }
});

module.exports = { name: 'FundraisingGoal', schema: fundraisingGoalSchema };