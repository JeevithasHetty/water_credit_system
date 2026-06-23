const Rating = require('../models/Rating');
const Order  = require('../models/Order');

const submitRating = async (req, res) => {
  try {
    const { orderId, sellerId, rating, review } = req.body;
    
    if (!orderId || !sellerId || !rating)
      return res.status(400).json({ success: false, message: 'orderId, sellerId, and rating required' });
    if (rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: 'Rating must be 1-5' });
    
    // Check order exists and belongs to this buyer
    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.buyer.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not your order' });
    if (order.deliveryStatus !== 'Delivered')
      return res.status(400).json({ success: false, message: 'Order must be delivered before rating' });
    
    // Check if already rated
    const existing = await Rating.findOne({ order: orderId });
    if (existing)
      return res.status(400).json({ success: false, message: 'Already rated this order' });
    
    const ratingDoc = await Rating.create({
      buyer: req.user._id,
      seller: sellerId,
      order: orderId,
      rating: +rating,
      review: review || '',
    });
    
    const pop = await ratingDoc.populate('buyer', 'name').populate('seller', 'name');
    res.status(201).json({ success: true, message: 'Rating submitted', rating: pop });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const getSellerRatings = async (req, res) => {
  try {
    const { id } = req.params;
    const ratings = await Rating.find({ seller: id })
      .populate('buyer', 'name')
      .sort({ createdAt: -1 });
    
    const average = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;
    
    res.json({ success: true, ratings, average: average.toFixed(1), count: ratings.length });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = { submitRating, getSellerRatings };
