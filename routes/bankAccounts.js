const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const BankAccount = require('../models/BankAccount');

// @route   GET /api/bankaccounts
// @desc    Get all bank accounts for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const bankAccounts = await BankAccount.find({ user: req.user.id });
    res.status(200).json(bankAccounts);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/bankaccounts
// @desc    Add a new bank account
// @access  Private
router.post('/', protect, async (req, res) => {
  const { bankName, accountType, balance, currency } = req.body;

  if (!bankName || !accountType || balance === undefined || balance === null || !currency) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const newBankAccount = new BankAccount({
      user: req.user.id,
      bankName,
      accountType,
      balance,
      currency,
    });

    const bankAccount = await newBankAccount.save();
    res.status(201).json(bankAccount);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/bankaccounts/:id
// @desc    Update a bank account
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { bankName, accountType, balance, currency } = req.body;

  try {
    // Bank account ko ID se dhoondo
    let bankAccount = await BankAccount.findById(req.params.id);

    if (!bankAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }

    // Ensure user owns the bank account
    // req.user.id string hai, bankAccount.user ObjectId hai, isliye toString() use kiya
    if (bankAccount.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this bank account' });
    }

    // Update fields
    bankAccount.bankName = bankName;
    bankAccount.accountType = accountType;
    bankAccount.balance = balance;
    bankAccount.currency = currency;

    await bankAccount.save(); // Changes ko save karo
    res.status(200).json(bankAccount);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/bankaccounts/:id
// @desc    Delete a bank account
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    // Bank account ko ID se dhoondo
    const bankAccount = await BankAccount.findById(req.params.id);

    if (!bankAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }

    // Ensure user owns the bank account
    if (bankAccount.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this bank account' });
    }

    // Document ko delete karo
    await BankAccount.deleteOne({ _id: req.params.id }); // Corrected: deleteOne with query
    // Ya simply: await bankAccount.deleteOne(); // Agar upar bankAccount object mil gaya hai

    res.status(200).json({ message: 'Bank account removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
