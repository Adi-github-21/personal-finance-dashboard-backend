const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Expense = require('../models/Expense');

// @route   GET /api/expenses
// @desc    Get all expenses for the logged-in user (can filter by month later)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id }).sort({ transactionDate: -1 }); 
    res.status(200).json(expenses);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/expenses
// @desc    Add a new expense
// @access  Private
router.post('/', protect, async (req, res) => {
  const { amount, category, description, transactionDate, source } = req.body;

  if (amount === undefined || !category || !description) {
    return res.status(400).json({ message: 'Please enter all required fields: Amount, Category, Description' });
  }

  try {
    const newExpense = new Expense({
      user: req.user.id,
      amount,
      category,
      description,
      transactionDate: transactionDate || Date.now(),
      source: source || 'Manual', 
    });

    const expense = await newExpense.save();
    res.status(201).json(expense);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update an expense
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { amount, category, description, transactionDate, source } = req.body;

  try {
    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this expense' });
    }

    expense.amount = amount;
    expense.category = category;
    expense.description = description;
    expense.transactionDate = transactionDate;
    expense.source = source;

    await expense.save();
    res.status(200).json(expense);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this expense' });
    }

    await Expense.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Expense removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
