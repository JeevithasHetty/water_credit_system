const User  = require('../models/User');
const Order = require('../models/Order');

const populatedOrder = (id) =>
  Order.findById(id)
    .populate('buyer',       'name email')
    .populate('transporter', 'name email availability liveLocation')
    .populate({ path: 'items.listing', populate: { path: 'seller', select: 'name email location' } });

const nextAllowed = {
  Assigned:  'Accepted',
  Accepted:  'InTransit',
  InTransit: 'Delivered',
};

// PUT /api/transporter/availability
const updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    if (!['online','offline','busy'].includes(availability))
      return res.status(400).json({ success: false, message: 'Invalid status' });
    if (!req.user.verified)
      return res.status(403).json({ success: false, message: 'Account not verified by admin yet' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { availability },
      { new: true, select: '-password' }
    );

    req.io.to('admins').emit('transporter_availability_changed', {
      transporterId: user._id,
      name:          user.name,
      availability,
    });

    // When going online, check for pending orders and auto-assign oldest
    if (availability === 'online') {
      const pendingOrder = await Order.findOne({
        deliveryStatus: 'Pending',
        transporter: null,
      }).sort({ createdAt: 1 });
      
      if (pendingOrder) {
        pendingOrder.transporter = req.user._id;
        pendingOrder.deliveryStatus = 'Assigned';
        await pendingOrder.save();
        
        const populatedOrder = (id) =>
          Order.findById(id)
            .populate('buyer', 'name email')
            .populate('transporter', 'name email availability liveLocation')
            .populate({ path: 'items.listing', populate: { path: 'seller', select: 'name email location' } });
        
        const pop = await populatedOrder(pendingOrder._id);
        
        req.io.to(`user:${req.user._id}`).emit('new_order_assigned', {
          order: pop,
          message: `New delivery job! Order from ${pendingOrder.buyer}.`,
        });
        
        req.io.to(`user:${pendingOrder.buyer}`).emit('order_status_updated', {
          orderId: pendingOrder._id,
          deliveryStatus: 'Assigned',
          transporter: pop.transporter,
          message: `Transporter ${user.name} has been assigned to your order.`,
        });
        
        req.io.to('admins').emit('admin_order_updated', {
          orderId: pendingOrder._id,
          deliveryStatus: 'Assigned',
          transporter: user.name,
          buyer: pendingOrder.buyer,
        });
      }
    }

    res.json({ success: true, message: `Now ${availability}`, user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/transporter/orders
const getTransporterOrders = async (req, res) => {
  try {
    const orders = await Order.find({ transporter: req.user._id })
      .populate('buyer', 'name email')
      .populate({ path: 'items.listing', populate: { path: 'seller', select: 'name email location' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// PUT /api/transporter/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOne({ _id: req.params.id, transporter: req.user._id });
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found or not yours' });

    if (nextAllowed[order.deliveryStatus] !== status)
      return res.status(400).json({
        success: false,
        message: `Cannot move from ${order.deliveryStatus} to ${status}`,
      });

    order.deliveryStatus = status;
    await order.save();

    // Free transporter when delivered
    if (status === 'Delivered') {
      await User.findByIdAndUpdate(req.user._id, { availability: 'online' });
      req.io.to('admins').emit('transporter_availability_changed', {
        transporterId: req.user._id,
        name:          req.user.name,
        availability:  'online',
      });
      
      // Check for pending unassigned orders and auto-assign oldest one
      const pendingOrder = await Order.findOne({
        deliveryStatus: 'Pending',
        transporter: null,
      }).sort({ createdAt: 1 });
      
      if (pendingOrder) {
        pendingOrder.transporter = req.user._id;
        pendingOrder.deliveryStatus = 'Assigned';
        await pendingOrder.save();
        
        const pop = await populatedOrder(pendingOrder._id);
        
        io.to(`user:${req.user._id}`).emit('new_order_assigned', {
          order: pop,
          message: `New delivery job! Order from ${pendingOrder.buyer}.`,
        });
        
        io.to(`user:${pendingOrder.buyer}`).emit('order_status_updated', {
          orderId: pendingOrder._id,
          deliveryStatus: 'Assigned',
          transporter: pop.transporter,
          message: `Transporter ${req.user.name} has been assigned to your order.`,
        });
        
        io.to('admins').emit('admin_order_updated', {
          orderId: pendingOrder._id,
          deliveryStatus: 'Assigned',
          transporter: req.user.name,
          buyer: pendingOrder.buyer,
        });
      }
    }

    const pop = await populatedOrder(order._id);
    const io  = req.io;

    // Emit to order room (buyer tracking)
    io.to(`order:${order._id}`).emit('order_status_updated', {
      orderId:        order._id,
      deliveryStatus: status,
      transporter:    pop.transporter,
      message:        statusMessage(status, req.user.name),
    });

    // Emit to buyer's personal room
    io.to(`user:${order.buyer}`).emit('order_status_updated', {
      orderId:        order._id,
      deliveryStatus: status,
      transporter:    pop.transporter,
      message:        statusMessage(status, req.user.name),
    });

    // Confirm to transporter
    io.to(`user:${req.user._id}`).emit('my_order_updated', {
      orderId:        order._id,
      deliveryStatus: status,
    });

    // Notify admin
    io.to('admins').emit('admin_order_updated', {
      orderId:        order._id,
      deliveryStatus: status,
      transporter:    req.user.name,
      buyer:          order.buyer,
    });

    res.json({ success: true, message: `Status → ${status}`, order: pop });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const statusMessage = (status, transporterName) => ({
  Accepted:  `${transporterName} has accepted your order and is preparing for pickup.`,
  InTransit: `${transporterName} is on the way with your water!`,
  Delivered: `Your order has been delivered! Thank you for using AquaFlow.`,
}[status] || `Order updated to ${status}`);

// PUT /api/transporter/location
const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat == null || lng == null)
      return res.status(400).json({ success: false, message: 'lat and lng required' });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { liveLocation: { lat, lng, updatedAt: new Date() } },
      { new: true, select: '-password' }
    );
    req.io.to('admins').emit('transporter_location', {
      transporterId: user._id,
      name: user.name,
      lat,
      lng,
    });
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = { updateAvailability, getTransporterOrders, updateOrderStatus, updateLocation };
