const mongoose = require('mongoose');

const LoanSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    loanName: {
        type: String,
        required: [true, 'Please add a loan name'],
        trim: true,
    },
    loanType: {
        type: String,
        required: [true ,'Please add a loan type'],
        enum: ['Home Loan', 'Car Loan', 'Personal Loan', 'Education Loan', 'Other'],
        default: 'Other',
    },
    totalLoanAmount: {
        type: Number,
        required: [true, 'Please add total loan amount'],
        min: [0, 'Total loan amount cannot be negative'],
    },
    interestRate: {
        type: Number,
        required: [true, 'Please add annual interest rate'],
        min: [0, 'Interest rate cannot be negative'],
    },
    loanTenureMonths: {
        type: Number,
        required: [true, 'Please add loan tenure in months'],
        min: [1, 'Loan tenure must be at least 1 month'],
    },
    emiAmount: {
        type: Number,
        required: [true,'Please add EMI amount'],
        min: [0, 'EMI amount cannot be negative'],
    },
    startDate: {
        type: Date,
        required: [true, 'Please add loan start date'],
    },
    nextDueDate: { 
        type: Date,
        required: [true, 'Please add next due date'],
    },
    remainingAmount: {
        type: Number,
        required: [true, 'Please add remaining amount'],
        min: [0, 'Remaining amount cannot be negative'],
    },
    totalInterestPaid: { 
        type: Number,
        default: 0,
        min: [0, 'Total interest paid cannot be negative'],
    },
    // Optional: You might want a payment history sub-document array here later
  // paymentHistory: [
  //   {
  //     paymentDate: { type: Date, default: Date.now },
  //     amountPaid: Number,
  //     principalPaid: Number,
  //     interestPaid: Number,
  //   }
  // ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Loan', LoanSchema);