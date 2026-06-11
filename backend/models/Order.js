const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyer:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    listing:       { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    quantity:      { type: Number, required: true, min: 1 },
    pricePerLitre: { type: Number, required: true },
  }],
  totalAmount:     { type: Number, required: true },
  transporter:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status:          { type: String, enum: ['Pending','Confirmed','Cancelled'], default: 'Confirmed' },
  deliveryStatus:  { type: String, enum: ['Pending','Assigned','Accepted','InTransit','Delivered'], default: 'Pending' },
  deliveryAddress: { type: String, required: true },
  notes:           { type: String, default: '' },
  paymentStatus:   { type: String, enum: ['Unpaid','Paid'], default: 'Unpaid' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
