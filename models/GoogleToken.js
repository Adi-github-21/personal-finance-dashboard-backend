const mongoose = require('mongoose');

const GoogleTokenSchema = mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    unique: true, // Har user ke liye sirf ek token entry
  },
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    // Refresh token hamesha nahi milta, lekin agar milta hai toh store karein
  },
  scope: {
    type: String,
  },
  tokenType: {
    type: String,
  },
  expiryDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update 'updatedAt' field on save
GoogleTokenSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('GoogleToken', GoogleTokenSchema);