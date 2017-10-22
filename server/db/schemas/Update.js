const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');

const updateSchema = new Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, trim: true, maxlength: 1000, required: true },
    dateAdded: { type: Date, required: true }
});

updateSchema.plugin(mongoosePaginate);

module.exports = { name: 'Update', schema: updateSchema };
