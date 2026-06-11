const express = require('express');
const r = express.Router();
const { checkout, getBuyerOrders, getSellerOrders } = require('../controllers/orderController');
const { protect, requireRole } = require('../middleware/auth');

r.post('/',      protect, requireRole('buyer'),  checkout);
r.get('/buyer',  protect, requireRole('buyer'),  getBuyerOrders);
r.get('/seller', protect, requireRole('seller'), getSellerOrders);

module.exports = r;
