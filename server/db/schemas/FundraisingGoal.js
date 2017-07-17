const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fundraisingGoalSchema = new Schema({
    camp: { type: mongoose.Schema.Types.ObjectId, ref: 'Camp' },
    submittedBy: { type: Number, ref: 'User', required: true },
    amount: { type: Number, min: 0, required: true },
    deadline: { type: Date, required: true }
});

fundraisingGoalSchema.methods.findFundraisingGoals = function() {
    return this.model('FundraisingGoal').find({ camp: this._id }).populate('Camp').exec();   
}

module.exports = { name: 'FundraisingGoal', schema: fundraisingGoalSchema };