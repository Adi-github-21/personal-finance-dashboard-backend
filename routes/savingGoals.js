const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const SavingGoal = require('../models/SavingGoal');

// @route   GET /api/savinggoals
// @desc    Get all saving goals for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const savingGoals = await SavingGoal.find({ user: req.user.id }).sort({ deadline: 1 });
    res.status(200).json(savingGoals);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/savinggoals
// @desc    Add a new saving goal
// @access  Private
router.post('/', protect, async (req, res) => {
  const { goalName, category, targetAmount, currentSaved, deadline } = req.body;

  if (!goalName || !category || targetAmount === undefined || !deadline) {
    return res.status(400).json({ message: 'Please enter all required fields: Goal Name, Category, Target Amount, Deadline' });
  }

  try {
    const newGoal = new SavingGoal({
      user: req.user.id,
      goalName,
      category,
      targetAmount,
      currentSaved: currentSaved !== undefined ? currentSaved : 0,
      deadline,
    });

    const goal = await newGoal.save();
    res.status(201).json(goal);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/savinggoals/:id
// @desc    Update a saving goal
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { goalName, category, targetAmount, currentSaved, deadline} = req.body;

  try {
    let goal = await SavingGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Saving goal not found' });
    }

    if (goal.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this saving goal' });
    }

    goal.goalName = goalName;
    goal.category = category;
    goal.targetAmount = targetAmount;
    goal.currentSaved = currentSaved;
    goal.deadline = deadline;

    await goal.save();
    res.status(200).json(goal);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/savinggoals/:id/add-money
// @desc    Add money to a saving goal
// @access  Private
router.post('/:id/add-money', protect, async (req, res) => {
  const { amount } = req.body;

  if (amount === undefined || amount <= 0) {
    return res.status(400).json({ message: 'Please provide a valid positive amount.' });
  }

  try {
    let goal = await SavingGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Saving goal not found' });
    }

    if (goal.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this saving goal' });
    }

    // currentSaved ko update karein
    goal.currentSaved += amount;

    await goal.save();
    res.status(200).json(goal);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/savinggoals/:id
// @desc    Delete a saving goal
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const goal = await SavingGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Saving goal not found' });
    }

    if (goal.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this saving goal' });
    }

    await SavingGoal.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Saving goal removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
