const mongoose = require('mongoose');

const SavingGoalSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    goalName: {
        type: String,
        required: [true, 'Please add a goal name'],
        trim: true,
    },
    category: {
        type: String,
        enum: ['Travel', 'Gadget', 'Emergency Fund', 'Education', 'Car', 'Home', 'Other'],
        default: 'Other',
    },
    targetAmount: {
        type: Number,
        required: [true, 'Please add a target amount'],
        min: [0, 'Target amount cannot be negative'],
    },
    currentSaved: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Current saved amount cannot be negative'],
    },
    deadline: {
        type: Date,
        required: [true, 'Please add a deadline'],
    },
    status: { // Active or Completed
        type: String,
        enum: ['Active', 'Completed'],
        default: 'Active',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('SavingGoal', SavingGoalSchema);