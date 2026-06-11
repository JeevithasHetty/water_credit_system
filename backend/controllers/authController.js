const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const TV   = require('../models/TransporterVerification');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const safeUser = (u) => ({
  _id: u._id, name: u.name, email: u.email,
  role: u.role, verified: u.verified, availability: u.availability,
});

const signup = async (req, res) => {
  try {
    const { name, email, password, role, aadhaarNumber, licenseNumber, vehicleType, vehicleCapacity } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ success: false, message: 'All fields required' });
    if (!['buyer','seller','transporter'].includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role' });
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password, role });

    if (role === 'transporter') {
      if (!aadhaarNumber || !licenseNumber) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ success: false, message: 'Aadhaar & license required for transporters' });
      }
      await TV.create({
        transporter: user._id,
        aadhaarNumber,
        licenseNumber,
        vehicleType: vehicleType || 'Tanker',
        vehicleCapacity: vehicleCapacity || 0,
      });
    }

    res.status(201).json({ success: true, token: sign(user._id), user: safeUser(user) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    res.json({ success: true, token: sign(user._id), user: safeUser(user) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = { signup, login, getMe };
