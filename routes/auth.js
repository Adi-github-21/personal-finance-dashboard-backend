const express = require('express');
const router = express.Router(); // Express Router ka use kar rahe hain
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // User model import kiya

// JWT token generate karne ka helper function
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { // Corrected: { id } as payload
    expiresIn: '1h', // Token 1 ghante ke liye valid rahega
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body; // Request body se name, email aur password nikala

  try {
    // Check if user already exists
    let user = await User.findOne({ email }); // Database mein email search kiya
    if (user) {
      return res.status(400).json({ message: 'User already exists' }); // Agar user hai toh error
    }

    // Naya user banao
    user = new User({
      name,
      email,
      password, // Password automatically hash ho jayega UserSchema.pre('save') hook se
    });

    await user.save(); // User ko database mein save kiya

    const token = generateToken(user._id); // JWT token generate kiya

    res.status(201).json({
      message: 'User registered successfully',
      token,
      userId: user._id,
      email: user.email,
      name: user.name, // Response mein name bhi bheja
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error'); // Server error hone par
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body; // Request body se email aur password nikala

  try {
    // Check if user exists
    // .select('+password') se password field bhi fetch hoga jo by default hidden hai
    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' }); // Agar user nahi hai toh error
    }

    // Password validate karo
    const isMatch = await user.matchPassword(password); // UserSchema ka method use kiya
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' }); // Agar password match nahi karta toh error
    }

    const token = generateToken(user._id); // JWT token generate kiya

    res.json({
      message: 'Logged in successfully',
      token,
      userId: user._id,
      email: user.email,
      name: user.name, // Login response mein bhi name bheja
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; // Router ko export kar rahe hain
