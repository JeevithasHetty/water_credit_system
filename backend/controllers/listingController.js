const Listing = require('../models/Listing');

const getListings = async (req, res) => {
  try {
    const { waterType } = req.query;
    const filter = { isActive: true };
    if (waterType && waterType !== 'all') filter.waterType = waterType;
    const listings = await Listing.find(filter)
      .populate('seller', 'name email badge')
      .sort({ createdAt: -1 });
    
    // Fetch ratings for each seller
    const Rating = require('../models/Rating');
    const listingsWithRatings = await Promise.all(
      listings.map(async (listing) => {
        const ratings = await Rating.find({ seller: listing.seller._id });
        const avg = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : 0;
        return {
          ...listing.toObject(),
          sellerRating: avg.toFixed(1),
          ratingCount: ratings.length,
        };
      })
    );
    
    res.json({ success: true, listings: listingsWithRatings });
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
    const pop = await listing.populate('seller', 'name email badge');

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
      .populate('seller', 'name email badge')
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

const restockListing = async (req, res) => {
  try {
    const { addQuantity } = req.body;
    if (!addQuantity || addQuantity <= 0)
      return res.status(400).json({ success: false, message: 'addQuantity must be positive' });
    
    const listing = await Listing.findOne({ _id: req.params.id, seller: req.user._id });
    if (!listing)
      return res.status(404).json({ success: false, message: 'Listing not found or not yours' });
    
    listing.quantityLitres += +addQuantity;
    listing.isActive = true;
    await listing.save();
    const pop = await listing.populate('seller', 'name email badge');
    
    res.json({ success: true, message: 'Stock updated', listing: pop });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = { getListings, createListing, getMyListings, deleteListing, restockListing };
