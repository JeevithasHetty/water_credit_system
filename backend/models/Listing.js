const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  seller:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:         { type: String, required: true, trim: true },
  description:   { type: String, default: '' },
  location:      { type: String, required: true },
  pricePerLitre: { type: Number, required: true, min: 0.01 },
  quantityLitres:{ type: Number, required: true, min: 1 },
  waterType:     { type: String, enum: ['drinking','agricultural','industrial','rainwater'], default: 'drinking' },
  isActive:      { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Listing', listingSchema);
