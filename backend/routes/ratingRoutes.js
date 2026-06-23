const express = require('express');
const r = express.Router();
const { submitRating, getSellerRatings } = require('../controllers/ratingController');
const { protect, requireRole } = require('../middleware/auth');

r.post('/', protect, requireRole('buyer'), submitRating);
r.get('/seller/:id', getSellerRatings);

module.exports = r;
