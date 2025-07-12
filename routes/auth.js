const express = require('express');
const router = express.Router(); // Express Router ka use kar rahe hain
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 


const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { 
    expiresIn: '1h', 
  });
};

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body; 

  try {
    let user = await User.findOne({ email }); 
    if (user) {
      return res.status(400).json({ message: 'User already exists' }); 
    }

    user = new User({
      name,
      email,
      password, 
    });

    await user.save(); 

    const token = generateToken(user._id); 

    res.status(201).json({
      message: 'User registered successfully',
      token,
      userId: user._id,
      email: user.email,
      name: user.name, 
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error'); 
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body; 

  try {
    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' }); 
    }

    const isMatch = await user.matchPassword(password); 
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id); 

    res.json({
      message: 'Logged in successfully',
      token,
      userId: user._id,
      email: user.email,
      name: user.name, 
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 
