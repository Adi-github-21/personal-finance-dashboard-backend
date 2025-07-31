const mongoose = require('mongoose');

const ExpenseSchema = mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  amount: {
    type: Number,
    required: [true, 'Please add expense amount'],
    min: [0, 'Expense amount cannot be negative'],
  },
  category: { 
    type: String,
    required: [true, 'Please add a category'],
    enum: ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Transport', 'Health', 'Education', 'Other'],
    default: 'Other',
  },
  description: {
    type: String,
    trim: true,
  },
  transactionDate: { 
    type: Date,
    default: Date.now,
  },
  source: { 
    type: String,
    enum: ['Manual', 'Automated'],
    default: 'Manual', 
  },
  // Optional: agar automated source ke liye details store karne ho
  // originalEmailSubject: String,
  // originalEmailBody: String,
  // originalTransactionId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Expense', ExpenseSchema);
