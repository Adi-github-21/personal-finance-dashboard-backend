const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Investment = require('../models/Investment');

// @route   GET /api/investments
// @desc    Get all investments for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const investments = await Investment.find({ user: req.user.id }).sort({ createdAt: -1 }); // Naye investments pehle dikhenge
    res.status(200).json(investments);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/investments
// @desc    Add a new investment
// @access  Private
router.post('/', protect, async (req, res) => {
  const { stockName, quantity, avgBuyPrice, currentMarketPrice, purchaseDate } = req.body;

  if (!stockName || quantity === undefined || avgBuyPrice === undefined || currentMarketPrice === undefined) {
    return res.status(400).json({ message: 'Please enter all required fields' });
  }

  try {
    const newInvestment = new Investment({
      user: req.user.id,
      stockName,
      quantity,
      avgBuyPrice,
      currentMarketPrice,
      purchaseDate: purchaseDate || Date.now(), // Agar date nahi di toh current date
    });

    const investment = await newInvestment.save();
    res.status(201).json(investment);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/investments/:id
// @desc    Update an investment
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { stockName, quantity, avgBuyPrice, currentMarketPrice, purchaseDate } = req.body;

  try {
    let investment = await Investment.findById(req.params.id);

    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    if (investment.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this investment' });
    }

    investment.stockName = stockName;
    investment.quantity = quantity;
    investment.avgBuyPrice = avgBuyPrice;
    investment.currentMarketPrice = currentMarketPrice;
    investment.purchaseDate = purchaseDate || investment.purchaseDate;

    await investment.save();
    res.status(200).json(investment);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/investments/:id
// @desc    Delete an investment
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);

    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    if (investment.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this investment' });
    }

    await Investment.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Investment removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
