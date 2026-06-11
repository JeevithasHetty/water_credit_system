const express = require('express');
const r = express.Router();
const { signup, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

r.post('/signup', signup);
r.post('/login',  login);
r.get('/me',      protect, getMe);

module.exports = r;
