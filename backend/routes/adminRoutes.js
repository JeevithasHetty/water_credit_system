const express = require('express');
const r = express.Router();
const { getTransporters, getVerifications, makeDecision, getAllOrders, getStats, getSellers, assignSellerBadge } = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/auth');

r.get('/transporters',              protect, requireRole('admin'), getTransporters);
r.get('/verifications',             protect, requireRole('admin'), getVerifications);
r.post('/transporters/:id/decision',protect, requireRole('admin'), makeDecision);
r.get('/orders',                    protect, requireRole('admin'), getAllOrders);
r.get('/stats',                     protect, requireRole('admin'), getStats);
r.get('/sellers',                   protect, requireRole('admin'), getSellers);
r.put('/sellers/:id/badge',         protect, requireRole('admin'), assignSellerBadge);

module.exports = r;
