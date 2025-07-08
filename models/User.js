const mongoose = require('mongoose'); // Mongoose library import ki
const bcrypt = require('bcryptjs');   // Passwords hash karne ke liye

// User Schema define kar rahe hain
const UserSchema = mongoose.Schema({
  name: { // Naya 'name' field add kiya
    type: String,
    required: [true, 'Please add a name'], // Name field mandatory hai
    trim: true // Leading/trailing spaces remove karega
  },
  email: {
    type: String,
    required: [true, 'Please add an email'], // Email field mandatory hai
    unique: true,                           // Har email unique hona chahiye
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please enter a valid email' // Email format validation
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'], // Password field mandatory hai
    minlength: [6, 'Password must be at least 6 characters'], // Minimum length
    select: false // Jab user data fetch hoga, toh password by default nahi dikhega (security)
  },
  createdAt: {
    type: Date,
    default: Date.now // Jab user banega, toh creation date automatically set ho jayegi
  }
});

// Password ko save karne se pehle hash karna (pre-save hook)
// IMPORTANT: Yahan 'async function' keyword use karna zaroori hai, arrow function nahi
UserSchema.pre('save', async function (next) {
  // Check karein ki password field modify hua hai ya naya banaya gaya hai
  if (!this.isModified('password')) {
    next(); // Agar nahi, toh next middleware par jaao
  }

  // Salt generate karo (random string for hashing)
  const salt = await bcrypt.genSalt(10);
  // Password ko hash karo aur save karo
  this.password = await bcrypt.hash(this.password, salt);
  next(); // Next middleware par jaao
});

// Password compare karne ka method (login ke liye)
// Yeh method User model par available hoga
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password); // Entered password ko hashed password se compare karo
};

module.exports = mongoose.model('User', UserSchema); // User model ko export kar rahe hain
