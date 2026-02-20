const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   POST /api/quotes
// @desc    Submit quote request
// @access  Public
router.post('/', upload.array('attachments', 3), async (req, res) => {
  try {
    const quoteData = req.body;
    
    // Handle uploaded attachments
    if (req.files && req.files.length > 0) {
      quoteData.attachments = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        filename: file.originalname,
      }));
    }

    const quote = await Quote.create(quoteData);

    // TODO: Send email notification to admin
    
    res.status(201).json({
      success: true,
      message: 'Quote request submitted successfully. We will contact you soon!',
      data: quote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/quotes
// @desc    Get all quote requests
// @access  Private/Admin
router.get('/', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (status) query.status = status;

    const quotes = await Quote.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('quotedBy', 'name email');

    const count = await Quote.countDocuments(query);

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: quotes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/quotes/:id
// @desc    Get single quote
// @access  Private/Admin
router.get('/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('quotedBy', 'name email');

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote request not found',
      });
    }

    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/quotes/:id
// @desc    Update quote status/price
// @access  Private/Admin
router.put('/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const updateData = req.body;
    updateData.quotedBy = req.user.id;

    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote request not found',
      });
    }

    // TODO: Send email to customer with quote

    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   DELETE /api/quotes/:id
// @desc    Delete quote
// @access  Private/Admin
router.delete('/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote request not found',
      });
    }

    res.json({
      success: true,
      message: 'Quote deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
