const express = require('express');
const r = express.Router();
const { getListings, createListing, getMyListings, deleteListing } = require('../controllers/listingController');
const { protect, requireRole } = require('../middleware/auth');

r.get('/',       getListings);
r.get('/my',     protect, requireRole('seller'), getMyListings);
r.post('/',      protect, requireRole('seller'), createListing);
r.delete('/:id', protect, requireRole('seller'), deleteListing);

module.exports = r;
