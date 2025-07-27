const mongoose = require('mongoose');

const DebtSchema = mongoose.Schema({
  user: { // Kis user se related debt hai
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  personName: { // Kis vyakti se debt hai (e.g., Rohan, Priya)
    type: String,
    required: [true, 'Please add person name'],
    trim: true,
  },
  amount: { // Debt ki original amount
    type: Number,
    required: [true, 'Please add amount'],
    min: [0, 'Amount cannot be negative'],
  },
  // remainingAmount: { // Agar partial payments implement karne hon toh
  //   type: Number,
  //   required: true,
  //   default: function() { return this.amount; } // Default to original amount
  // },
  type: { // 'I Owe' (you owe them) or 'Owed To Me' (they owe you)
    type: String,
    required: [true, 'Please specify debt type (I Owe / Owed To Me)'],
    enum: ['I Owe', 'Owed To Me'],
  },
  description: { // Debt ka description (e.g., Pizza, Movie Tickets)
    type: String,
    trim: true,
  },
  category: { // e.g., Food, Travel, Utilities
    type: String,
    enum: ['Food', 'Travel', 'Rent', 'Utilities', 'Shopping', 'Other'],
    default: 'Other',
  },
  transactionDate: { // Jab transaction hua
    type: Date,
    default: Date.now,
  },
  dueDate: { // Jab tak settle karna hai (optional)
    type: Date,
  },
  status: { // Debt ka status: Pending, Paid
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Debt', DebtSchema);
