const express = require('express');
const r = express.Router();
const { updateAvailability, getTransporterOrders, updateOrderStatus, updateLocation } = require('../controllers/transporterController');
const { protect, requireRole } = require('../middleware/auth');

r.put('/availability',      protect, requireRole('transporter'), updateAvailability);
r.get('/orders',            protect, requireRole('transporter'), getTransporterOrders);
r.put('/orders/:id/status', protect, requireRole('transporter'), updateOrderStatus);
r.put('/location',          protect, requireRole('transporter'), updateLocation);

module.exports = r;
