const Listing = require('../models/Listing');

const getListings = async (req, res) => {
  try {
    const { waterType } = req.query;
    const filter = { isActive: true };
    if (waterType && waterType !== 'all') filter.waterType = waterType;
    const listings = await Listing.find(filter)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, listings });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const createListing = async (req, res) => {
  try {
    const { title, description, location, pricePerLitre, quantityLitres, waterType } = req.body;
    if (!title || !location || !pricePerLitre || !quantityLitres)
      return res.status(400).json({ success: false, message: 'title, location, price, quantity required' });

    const listing = await Listing.create({
      seller: req.user._id,
      title,
      description: description || '',
      location,
      pricePerLitre: +pricePerLitre,
      quantityLitres: +quantityLitres,
      waterType: waterType || 'drinking',
    });
    const pop = await listing.populate('seller', 'name email');

    // Broadcast new listing to all connected clients
    req.io.emit('new_listing', { listing: pop });

    res.status(201).json({ success: true, listing: pop });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.user._id })
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, listings });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, seller: req.user._id });
    if (!listing)
      return res.status(404).json({ success: false, message: 'Not found or not yours' });
    await Listing.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = { getListings, createListing, getMyListings, deleteListing };
