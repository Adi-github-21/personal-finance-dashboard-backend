const mongoose = require('mongoose');

const InvestmentSchema = mongoose.Schema({
  user: { // Kis user ka investment hai
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  stockName: {
    type: String,
    required: [true, 'Please add a stock name'],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Please add quantity'],
    min: [0, 'Quantity cannot be negative'],
  },
  avgBuyPrice: {
    type: Number,
    required: [true, 'Please add average buy price'],
    min: [0, 'Average buy price cannot be negative'],
  },
  // CMP (Current Market Price) ko bhi store karenge, shuru mein manual input
  currentMarketPrice: {
    type: Number,
    required: [true, 'Please add current market price'],
    min: [0, 'Current market price cannot be negative'],
  },
  purchaseDate: { // Optional: Kab kharida gaya
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Investment', InvestmentSchema);
