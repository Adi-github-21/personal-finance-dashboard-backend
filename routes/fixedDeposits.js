const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const FixedDeposit = require('../models/FixedDeposit');

// @route   GET /api/fixeddeposits
// @desc    Get all fixed deposits for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const fixedDeposits = await FixedDeposit.find({ user: req.user.id }).sort({ startDate: -1 });
    res.status(200).json(fixedDeposits);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/fixeddeposits
// @desc    Add a new fixed deposit
// @access  Private
router.post('/', protect, async (req, res) => {
  const { bankName, principalAmount, interestRate, startDate, tenure, fdAccountNumber, compoundingFrequency, interestPayout } = req.body;

  if (!bankName || principalAmount === undefined || interestRate === undefined || !startDate || tenure === undefined) {
    return res.status(400).json({ message: 'Please enter all required fields: Bank Name, Principal, Rate, Start Date, Tenure' });
  }

  try {
    const newFixedDeposit = new FixedDeposit({
      user: req.user.id,
      bankName,
      principalAmount,

      interestRate,
      startDate,
      tenure,
      fdAccountNumber,
      compoundingFrequency,
      interestPayout,
    });

    const fixedDeposit = await newFixedDeposit.save();
    res.status(201).json(fixedDeposit);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/fixeddeposits/:id
// @desc    Update a fixed deposit
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { bankName, principalAmount, interestRate, startDate, tenure, fdAccountNumber, compoundingFrequency, interestPayout } = req.body;

  try {
    let fixedDeposit = await FixedDeposit.findById(req.params.id);

    if (!fixedDeposit) {
      return res.status(404).json({ message: 'Fixed Deposit not found' });
    }

    if (fixedDeposit.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this Fixed Deposit' });
    }

    fixedDeposit.bankName = bankName;
    fixedDeposit.principalAmount = principalAmount;
    fixedDeposit.interestRate = interestRate;
    fixedDeposit.startDate = startDate;
    fixedDeposit.tenure = tenure;
    fixedDeposit.fdAccountNumber = fdAccountNumber;
    fixedDeposit.compoundingFrequency = compoundingFrequency;
    fixedDeposit.interestPayout = interestPayout;

    await fixedDeposit.save();
    res.status(200).json(fixedDeposit);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/fixeddeposits/:id
// @desc    Delete a fixed deposit
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const fixedDeposit = await FixedDeposit.findById(req.params.id);

    if (!fixedDeposit) {
      return res.status(404).json({ message: 'Fixed Deposit not found' });
    }

    if (fixedDeposit.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this Fixed Deposit' });
    }

    await FixedDeposit.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Fixed Deposit removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

