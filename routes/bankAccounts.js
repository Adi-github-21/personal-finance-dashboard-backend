const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const BankAccount = require('../models/BankAccount');
const multer = require('multer'); // Import multer
const path = require('path'); // Import path module for handling file paths

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 'uploads/' directory should exist in your backend root
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate a unique filename with original extension
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

// Filter for image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit (adjust as needed)
  },
});


// @route   GET /api/bankaccounts
// @desc    Get all bank accounts for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const bankAccounts = await BankAccount.find({ user: req.user.id });
    res.status(200).json(bankAccounts);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/bankaccounts
// @desc    Add a new bank account
// @access  Private
// Use upload.single('profilePhoto') middleware to handle file upload
router.post('/', protect, upload.single('profilePhoto'), async (req, res) => {
  // req.body now contains text fields, req.file contains the uploaded file
  const { bankName, accountType, balance, currency } = req.body;
  const profilePhotoUrl = req.file ? `/uploads/${req.file.filename}` : ''; // Store the path to the uploaded file

  if (!bankName || !accountType || balance === undefined || balance === null || !currency) {
    // If a file was uploaded but other fields are missing, delete the file
    if (req.file) {
      const fs = require('fs');
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }
    return res.status(400).json({ message: 'Please enter all required fields' });
  }

  try {
    const newBankAccount = new BankAccount({
      user: req.user.id,
      bankName,
      accountType,
      balance,
      currency,
      profilePhotoUrl, // Store the URL/path
    });

    const bankAccount = await newBankAccount.save();
    res.status(201).json(bankAccount);
  } catch (error) {
    console.error(error.message);
    // If an error occurs during save, delete the uploaded file
    if (req.file) {
      const fs = require('fs');
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/bankaccounts/:id
// @desc    Update a bank account
// @access  Private
// Use upload.single('profilePhoto') middleware for updates too
router.put('/:id', protect, upload.single('profilePhoto'), async (req, res) => {
  const { bankName, accountType, balance, currency, profilePhotoUrl: existingPhotoUrl } = req.body; // existingPhotoUrl for cases where no new file is uploaded

  try {
    let bankAccount = await BankAccount.findById(req.params.id);

    if (!bankAccount) {
      // If a file was uploaded but account not found, delete the file
      if (req.file) {
        const fs = require('fs');
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
      }
      return res.status(404).json({ message: 'Bank account not found' });
    }

    if (bankAccount.user.toString() !== req.user.id) {
      // If a file was uploaded but not authorized, delete the file
      if (req.file) {
        const fs = require('fs');
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
      }
      return res.status(401).json({ message: 'Not authorized to update this bank account' });
    }

    // If a new file is uploaded, delete the old one (if exists) and update the URL
    if (req.file) {
      if (bankAccount.profilePhotoUrl) {
        const oldPhotoPath = path.join(__dirname, '..', bankAccount.profilePhotoUrl);
        const fs = require('fs');
        fs.unlink(oldPhotoPath, (err) => {
          if (err) console.error('Error deleting old profile photo:', err);
        });
      }
      bankAccount.profilePhotoUrl = `/uploads/${req.file.filename}`;
    } else if (existingPhotoUrl === '') {
      // If profilePhotoUrl is explicitly set to empty string from frontend (user removed photo)
      if (bankAccount.profilePhotoUrl) {
        const oldPhotoPath = path.join(__dirname, '..', bankAccount.profilePhotoUrl);
        const fs = require('fs');
        fs.unlink(oldPhotoPath, (err) => {
          if (err) console.error('Error deleting old profile photo:', err);
        });
      }
      bankAccount.profilePhotoUrl = '';
    }
    // If req.file is null and existingPhotoUrl is not empty, it means user didn't change photo, so keep existing.

    // Update other fields
    bankAccount.bankName = bankName;
    bankAccount.accountType = accountType;
    bankAccount.balance = balance;
    bankAccount.currency = currency;

    await bankAccount.save();
    res.status(200).json(bankAccount);
  } catch (error) {
    console.error(error.message);
    // If an error occurs during save, delete the newly uploaded file
    if (req.file) {
      const fs = require('fs');
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/bankaccounts/:id
// @desc    Delete a bank account
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const bankAccount = await BankAccount.findById(req.params.id);

    if (!bankAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }

    if (bankAccount.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this bank account' });
    }

    // Delete the associated profile photo file from the server
    if (bankAccount.profilePhotoUrl) {
      const photoPath = path.join(__dirname, '..', bankAccount.profilePhotoUrl); // Adjust path as needed
      const fs = require('fs');
      fs.unlink(photoPath, (err) => {
        if (err) console.error('Error deleting profile photo file:', err);
      });
    }

    await BankAccount.deleteOne({ _id: req.params.id });

    res.status(200).json({ message: 'Bank account removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
