const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const safeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  verified: user.verified,
  availability: user.availability,
  liveLocation: user.liveLocation,
  rejectionReason: user.rejectionReason,
  badge: user.badge,
  createdAt: user.createdAt,
});

const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    if (!['buyer', 'seller', 'transporter', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, role });

    return res.status(201).json({ success: true, token: sign(user._id), user: safeUser(user) });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    return res.json({ success: true, token: sign(user._id), user: safeUser(user) });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    return res.json({ success: true, user: req.user });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = { signup, login, getMe };
