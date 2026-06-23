const express = require('express');
const r = express.Router();
const { checkout, getBuyerOrders, getSellerOrders, getSellerAnalytics } = require('../controllers/orderController');
const { protect, requireRole } = require('../middleware/auth');

r.post('/',             protect, requireRole('buyer'),  checkout);
r.get('/buyer',         protect, requireRole('buyer'),  getBuyerOrders);
r.get('/seller',        protect, requireRole('seller'), getSellerOrders);
r.get('/seller/analytics', protect, requireRole('seller'), getSellerAnalytics);

module.exports = r;
