const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');

const activitySchema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 650 },
  dateAdded: { type: Date, required: true }
});

activitySchema.plugin(mongoosePaginate);

module.exports = { name: 'Activity', schema: activitySchema };
