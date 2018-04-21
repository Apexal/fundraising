const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');

const regionSchema = new Schema({
  approved: { type: Boolean, default: false },
  name: {
    type: String,
    trim: true,
    unique: true,
    required: true,
    maxlength: 30
  },
  center: { type: String, trim: true, maxlength: 200 },
  ambassador: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: { type: String, trim: true, maxlength: 2000 },
  dateAdded: { type: Date, required: true }
});

regionSchema.plugin(mongoosePaginate);

module.exports = { name: 'Region', schema: regionSchema };
