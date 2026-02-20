const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { protect, restrictTo } = require('../middleware/auth');

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post('/', async (req, res) => {
  try {
    const contact = await Contact.create(req.body);

    // TODO: Send email notification

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
      data: contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/contact
// @desc    Get all contact submissions
// @access  Private/Admin
router.get('/', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Contact.countDocuments(query);

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: contacts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/contact/:id
// @desc    Update contact status
// @access  Private/Admin
router.put('/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
