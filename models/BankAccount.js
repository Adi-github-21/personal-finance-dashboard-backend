const mongoose = require('mongoose');

const BankAccountSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    bankName: {
        type: String,
        required: [true, 'Please add a bank name'],
        trim: true,
    },
    accountType: {
        type: String,
        required: [true, 'Please add a account type'],
        enum: ['Savings','Current','Checking','Other'],
        default: 'Savings',
    },
    balance: {
        type: Number,
        required: [true, 'Please add a balance'],
        default: 0,
    },
    currency: {
        type: String,
        required: [true, 'Please add a currency'],
        default: 'INR',
    },
    profilePhotoUrl: { // New field for profile photo URL
        type: String,
        default: '', // Default to empty string if no photo is provided
    },
    createdAt: {
    type: Date,
    default: Date.now,
    },
});

module.exports = mongoose.model('BankAccount',BankAccountSchema);