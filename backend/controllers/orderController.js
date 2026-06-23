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

    // Deduct stock from listings and check for low stock
    for (const item of orderItems) {
      const listing = await Listing.findByIdAndUpdate(
        item.listing,
        { $inc: { quantityLitres: -item.quantity } },
        { new: true }
      );
      
      // Mark as inactive if stock depleted
      if (listing.quantityLitres <= 0) {
        await Listing.findByIdAndUpdate(item.listing, { isActive: false });
      }
      
      // Emit low stock warning if below 500L
      if (listing.quantityLitres - item.quantity > 500 && listing.quantityLitres <= 500) {
        req.io.to(`user:${listing.seller}`).emit('low_stock', {
          listingId: listing._id,
          title: listing.title,
          remaining: Math.max(0, listing.quantityLitres),
        });
      }
    }

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

// GET /api/orders/seller/analytics
const getSellerAnalytics = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const myListings = await Listing.find({ seller: sellerId }).select('_id waterType');
    const listingIds = myListings.map(l => l._id);

    if (listingIds.length === 0) {
      return res.json({
        success: true,
        totalRevenue: 0,
        totalLitresSold: 0,
        totalOrders: 0,
        ordersByWaterType: { drinking: 0, agricultural: 0, industrial: 0, rainwater: 0 },
        revenueByMonth: [],
        topListing: null,
        thisWeekOrders: 0,
        lastWeekOrders: 0,
      });
    }

    const allOrders = await Order.find({ 'items.listing': { $in: listingIds } })
      .populate({ path: 'items.listing', select: 'waterType title' });

    // Filter orders that are Delivered (completed sales)
    const completedOrders = allOrders.filter(o => o.deliveryStatus === 'Delivered');

    // Calculate totals
    let totalRevenue = 0;
    let totalLitres = 0;
    const waterTypeCounts = { drinking: 0, agricultural: 0, industrial: 0, rainwater: 0 };
    const monthlyRevenue = {};
    const listingOrders = {};

    const today = new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);

    let thisWeekOrders = 0;
    let lastWeekOrders = 0;

    completedOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const month = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;

      order.items.forEach(item => {
        const listing = item.listing;
        const isMine = listingIds.some(id => id.equals(listing._id));
        if (!isMine) return;

        const revenue = item.quantity * item.pricePerLitre;
        totalRevenue += revenue;
        totalLitres += item.quantity;

        // Water type count
        const wt = listing.waterType || 'drinking';
        if (waterTypeCounts.hasOwnProperty(wt)) waterTypeCounts[wt]++;

        // Monthly revenue
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + revenue;

        // Listing order count
        listingOrders[listing._id] = (listingOrders[listing._id] || 0) + 1;
      });

      // Week count
      if (orderDate >= thisWeekStart) thisWeekOrders++;
      else if (orderDate >= lastWeekStart && orderDate < lastWeekEnd) lastWeekOrders++;
    });

    // Top listing
    let topListing = null;
    let maxOrders = 0;
    for (const [listingId, count] of Object.entries(listingOrders)) {
      if (count > maxOrders) {
        maxOrders = count;
        const listing = myListings.find(l => l._id.equals(listingId));
        const fullListing = await Listing.findById(listingId).select('title waterType');
        topListing = { id: listingId, title: fullListing?.title, orders: count };
      }
    }

    // Revenue by month (last 6 months)
    const revenueByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleString('default', { month: 'short' });
      revenueByMonth.push({
        month: monthName,
        revenue: monthlyRevenue[monthKey] || 0,
      });
    }

    res.json({
      success: true,
      totalRevenue,
      totalLitresSold: totalLitres,
      totalOrders: completedOrders.length,
      ordersByWaterType: waterTypeCounts,
      revenueByMonth,
      topListing,
      thisWeekOrders,
      lastWeekOrders,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = { checkout, getBuyerOrders, getSellerOrders, getSellerAnalytics };
