// personal-finance-dashboard-backend/routes/debts.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Debt = require('../models/Debt');

// @route   GET /api/debts
// @desc    Get all debts for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const debts = await Debt.find({ user: req.user.id }).sort({ transactionDate: -1 });
    res.status(200).json(debts);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/debts
// @desc    Add a new debt
// @access  Private
router.post('/', protect, async (req, res) => {
  const { personName, amount, type, description, category, transactionDate, dueDate, status } = req.body;

  if (!personName || amount === undefined || !type || !description) {
    return res.status(400).json({ message: 'Please enter all required fields: Person Name, Amount, Type, Description' });
  }

  try {
    const newDebt = new Debt({
      user: req.user.id,
      personName,
      amount,
      type,
      description,
      category,
      transactionDate: transactionDate || Date.now(),
      dueDate: dueDate || null, // dueDate optional
      status: status || 'Pending',
    });

    const debt = await newDebt.save();
    res.status(201).json(debt);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/debts/:id
// @desc    Update a debt (including changing status to Paid)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { personName, amount, type, description, category, transactionDate, dueDate, status } = req.body;

  try {
    let debt = await Debt.findById(req.params.id);

    if (!debt) {
      return res.status(404).json({ message: 'Debt entry not found' });
    }

    if (debt.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this debt entry' });
    }

    debt.personName = personName;
    debt.amount = amount;
    debt.type = type;
    debt.description = description;
    debt.category = category;
    debt.transactionDate = transactionDate;
    debt.dueDate = dueDate;
    debt.status = status;

    await debt.save();
    res.status(200).json(debt);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/debts/:id/settle
// @desc    Mark a debt as settled/paid
// @access  Private
router.post('/:id/settle', protect, async (req, res) => {
  try {
    let debt = await Debt.findById(req.params.id);

    if (!debt) {
      return res.status(404).json({ message: 'Debt entry not found' });
    }

    if (debt.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to settle this debt entry' });
    }

    if (debt.status === 'Paid') {
      return res.status(400).json({ message: 'Debt is already marked as Paid.' });
    }

    debt.status = 'Paid'; // Status ko 'Paid' kiya
    await debt.save();
    res.status(200).json(debt); // Updated debt object return karein
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});


// @route   DELETE /api/debts/:id
// @desc    Delete a debt entry
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const debt = await Debt.findById(req.params.id);

    if (!debt) {
      return res.status(404).json({ message: 'Debt entry not found' });
    }

    if (debt.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this debt entry' });
    }

    await Debt.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Debt entry removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
