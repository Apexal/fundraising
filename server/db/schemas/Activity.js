const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const activitySchema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 650 },
    dateAdded: { type: Date, required: true }
});

module.exports = { name: 'Activity', schema: activitySchema };
