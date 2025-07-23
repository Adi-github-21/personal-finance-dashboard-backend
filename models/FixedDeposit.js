const mongoose = require('mongoose');

const FixedDepositSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    bankName: {
        type: String,
        required: [true,'Please add a bank name'],
        trim: true,
    },
    principalAmount: {
        type: Number,
        required: [true,'Please add principal amount'],
        min: [0, 'Principal amount cannot be negative'],
    },
    interestRate: {
        type: Number,
        required: [true, 'Please add interest rate'],
        min: [0,'Interest rate cannot br negative'],
    },
    startDate: {
    type: Date,
    required: [true, 'Please add start date'],
  },
  tenure: { 
    type: Number,
    required: [true, 'Please add tenure in months'],
    min: [1, 'Tenure must be at least 1 month'],
  },
  fdAccountNumber: { 
    type: String,
    trim: true,
  },
  compoundingFrequency: { 
    type: String,
    enum: ['Monthly', 'Quarterly', 'Half-Yearly', 'Annually', 'At Maturity', 'Other'],
    default: 'Annually',
  },
  interestPayout: { 
    type: String,
    enum: ['Cumulative', 'Periodic'],
    default: 'Cumulative',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('FixedDeposit', FixedDepositSchema);