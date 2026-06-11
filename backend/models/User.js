const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role:     { type: String, enum: ['buyer','seller','transporter','admin'], required: true },
  verified: {
    type: Boolean,
    default: function() { return this.role !== 'transporter'; },
  },
  availability: { type: String, enum: ['online','offline','busy'], default: 'offline' },
  liveLocation: {
    lat:       { type: Number, default: null },
    lng:       { type: Number, default: null },
    updatedAt: { type: Date,   default: null },
  },
  rejectionReason:   { type: String, default: null },
  isSocketConnected: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
