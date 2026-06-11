const Order   = require('../models/Order');
const Listing = require('../models/Listing');
const User    = require('../models/User');

// Fully populated order helper
const populated = (id) =>
  Order.findById(id)
    .populate('buyer',       'name email')
    .populate('transporter', 'name email availability liveLocation')
    .populate({ path: 'items.listing', populate: { path: 'seller', select: 'name email location' } });

// POST /api/orders  — checkout + auto-assign transporter + emit socket events
const checkout = async (req, res) => {
  try {
    const { items, deliveryAddress, notes } = req.body;
    if (!items?.length)
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    if (!deliveryAddress)
      return res.status(400).json({ success: false, message: 'Delivery address required' });

    // Validate items and compute total
    let totalAmount = 0;
    const orderItems = [];
    for (const item of items) {
      const listing = await Listing.findById(item.listingId);
      if (!listing || !listing.isActive)
        return res.status(404).json({ success: false, message: `Listing not found: ${item.listingId}` });
      if (item.quantity > listing.quantityLitres)
        return res.status(400).json({ success: false, message: `Insufficient stock for ${listing.title}` });
      totalAmount += item.quantity * listing.pricePerLitre;
      orderItems.push({ listing: listing._id, quantity: item.quantity, pricePerLitre: listing.pricePerLitre });
    }

    // Auto-assign: find first online verified transporter
    const transporter = await User.findOne({ role: 'transporter', verified: true, availability: 'online' });

    const order = await Order.create({
      buyer: req.user._id,
      items: orderItems,
      totalAmount,
      transporter:     transporter?._id || null,
      deliveryStatus:  transporter ? 'Assigned' : 'Pending',
      status:          'Confirmed',
      deliveryAddress,
      notes: notes || '',
    });

    if (transporter) {
      await User.findByIdAndUpdate(transporter._id, { availability: 'busy' });
    }

    const pop = await populated(order._id);
    const io  = req.io;

    // 1. Notify buyer
    io.to(`user:${req.user._id}`).emit('order_placed', {
      order: pop,
      message: transporter
        ? `Order placed! Transporter ${transporter.name} has been assigned.`
        : 'Order placed. Waiting for an available transporter.',
    });

    // 2. Notify assigned transporter
    if (transporter) {
      io.to(`user:${transporter._id}`).emit('new_order_assigned', {
        order: pop,
        message: `New delivery job! Order from ${req.user.name}.`,
      });
    } else {
      io.to('transporters').emit('new_order_available', {
        orderId:  order._id,
        location: deliveryAddress,
        amount:   totalAmount,
      });
    }

    // 3. Notify admin
    io.to('admins').emit('admin_new_order', {
      orderId:     order._id,
      buyerName:   req.user.name,
      amount:      totalAmount,
      transporter: transporter?.name || 'Unassigned',
    });

    res.status(201).json({
      success: true,
      message: transporter
        ? `Transporter ${transporter.name} assigned!`
        : 'Order placed. Finding transporter...',
      order: pop,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/orders/buyer
const getBuyerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('transporter', 'name email availability liveLocation')
      .populate({ path: 'items.listing', populate: { path: 'seller', select: 'name email location' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/orders/seller
const getSellerOrders = async (req, res) => {
  try {
    const mine   = await Listing.find({ seller: req.user._id }).select('_id');
    const ids    = mine.map(l => l._id);
    const orders = await Order.find({ 'items.listing': { $in: ids } })
      .populate('buyer',       'name email')
      .populate('transporter', 'name email')
      .populate({ path: 'items.listing', populate: { path: 'seller', select: 'name' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = { checkout, getBuyerOrders, getSellerOrders };
