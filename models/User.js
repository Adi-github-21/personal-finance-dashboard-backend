const mongoose = require('mongoose'); 
const bcrypt = require('bcryptjs');   

const UserSchema = mongoose.Schema({
  name: { 
    type: String,
    required: [true, 'Please add a name'], 
    trim: true 
  },
  email: {
    type: String,
    required: [true, 'Please add an email'], 
    unique: true,                         
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please enter a valid email' 
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'], 
    minlength: [6, 'Password must be at least 6 characters'], 
    select: false // Jab user data fetch hoga, toh password by default nahi dikhega (security)
  },
  createdAt: {
    type: Date,
    default: Date.now 
  }
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next(); 
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next(); 
});

// Password compare karne ka method (login ke liye)
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password); 
};

module.exports = mongoose.model('User', UserSchema); 
