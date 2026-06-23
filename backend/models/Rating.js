const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  buyer:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order:  { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  review: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Rating', ratingSchema);
