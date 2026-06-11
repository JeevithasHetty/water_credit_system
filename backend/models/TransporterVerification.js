const mongoose = require('mongoose');

const tvSchema = new mongoose.Schema({
  transporter:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  verifiedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  aadhaarNumber:  { type: String, required: true },
  licenseNumber:  { type: String, required: true },
  vehicleType:    { type: String, default: 'Tanker' },
  vehicleCapacity:{ type: Number, default: 0 },
  status:         { type: String, enum: ['Pending','Verified','Rejected'], default: 'Pending' },
  remarks:        { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('TransporterVerification', tvSchema);
