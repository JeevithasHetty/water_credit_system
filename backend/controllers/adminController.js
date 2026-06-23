const User  = require('../models/User');
const TV    = require('../models/TransporterVerification');
const Order = require('../models/Order');

const getTransporters = async (req, res) => {
  try {
    const transporters = await User.find({ role: 'transporter' }).select('-password');
    res.json({ success: true, transporters });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const getVerifications = async (req, res) => {
  try {
    const verifications = await TV.find()
      .populate('transporter', 'name email verified availability')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, verifications });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const makeDecision = async (req, res) => {
  try {
    const { decision, remarks } = req.body;
    const { id } = req.params;

    if (!['Verified','Rejected'].includes(decision))
      return res.status(400).json({ success: false, message: 'decision must be Verified or Rejected' });

    const transporter = await User.findOne({ _id: id, role: 'transporter' });
    if (!transporter)
      return res.status(404).json({ success: false, message: 'Transporter not found' });

    const tv = await TV.findOne({ transporter: id });
    if (!tv)
      return res.status(404).json({ success: false, message: 'Verification record not found' });

    tv.status     = decision;
    tv.verifiedBy = req.user._id;
    tv.remarks    = remarks || '';
    await tv.save();

    const isVerified = decision === 'Verified';
    await User.findByIdAndUpdate(id, {
      verified:        isVerified,
      rejectionReason: isVerified ? null : (remarks || 'Not specified'),
    });

    // Real-time notification to the transporter
    req.io.to(`user:${id}`).emit('verification_result', {
      decision,
      remarks: remarks || '',
      message: isVerified
        ? 'Congratulations! Your account has been verified. You can now go online.'
        : `Your account was rejected. Reason: ${remarks || 'Not specified'}`,
    });

    res.json({ success: true, message: `Transporter ${decision}` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('buyer',       'name email')
      .populate('transporter', 'name email availability')
      .populate({ path: 'items.listing', populate: { path: 'seller', select: 'name' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const getStats = async (req, res) => {
  try {
    const [buyers, sellers, transporters, verified, orders, pending] = await Promise.all([
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ role: 'seller' }),
      User.countDocuments({ role: 'transporter' }),
      User.countDocuments({ role: 'transporter', verified: true }),
      Order.countDocuments(),
      TV.countDocuments({ status: 'Pending' }),
    ]);
    res.json({ success: true, stats: { buyers, sellers, transporters, verified, orders, pending } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const getSellers = async (req, res) => {
  try {
    const sellers = await User.find({ role: 'seller' })
      .select('name email badge verified createdAt')
      .lean();
    
    const Listing = require('../models/Listing');
    const sellersWithCounts = await Promise.all(
      sellers.map(async (seller) => {
        const listingCount = await Listing.countDocuments({ seller: seller._id, isActive: true });
        const orderCount = await Listing.aggregate([
          { $match: { seller: seller._id } },
          { $lookup: { from: 'orders', localField: '_id', foreignField: 'items.listing', as: 'orders' } },
          { $group: { _id: null, count: { $sum: { $size: '$orders' } } } },
        ]);
        return {
          ...seller,
          listingCount,
          orderCount: orderCount[0]?.count || 0,
        };
      })
    );
    
    res.json({ success: true, sellers: sellersWithCounts });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const assignSellerBadge = async (req, res) => {
  try {
    const { badge } = req.body;
    const { id } = req.params;
    
    if (badge && !['silver', 'gold', 'diamond'].includes(badge)) {
      return res.status(400).json({ success: false, message: 'Invalid badge value' });
    }
    
    const seller = await User.findOne({ _id: id, role: 'seller' });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }
    
    seller.badge = badge || null;
    await seller.save();
    
    req.io.to(`user:${id}`).emit('badge_assigned', {
      badge: badge || null,
      message: badge 
        ? `🎉 You've been awarded the ${badge.charAt(0).toUpperCase() + badge.slice(1)} badge!`
        : 'Your badge has been removed.',
    });
    
    res.json({ success: true, message: `Badge ${badge ? 'assigned' : 'removed'}`, seller });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = { getTransporters, getVerifications, makeDecision, getAllOrders, getStats, getSellers, assignSellerBadge };
