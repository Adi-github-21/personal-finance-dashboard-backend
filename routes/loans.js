const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Loan = require('../models/Loan');

// Helper function to calculate EMI (Backend side)
const calculateEmi = (principal, annualRate, tenureMonths) => {
  if (annualRate === 0) { // Handle 0 interest rate to avoid division by zero
    return principal / tenureMonths;
  }
  const monthlyRate = annualRate / (12 * 100); // r
  const n = tenureMonths; // n
  const emi = principal * monthlyRate * Math.pow((1 + monthlyRate), n) / (Math.pow((1 + monthlyRate), n) - 1);
  return isNaN(emi) ? 0 : emi; // Handle NaN case
};

// @route   GET /api/loans
// @desc    Get all loans for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const loans = await Loan.find({ user: req.user.id }).sort({ nextDueDate: 1 }); // Next due date ke hisab se sort karein
    res.status(200).json(loans);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/loans
// @desc    Add a new loan
// @access  Private
router.post('/', protect, async (req, res) => {
  const { loanName, loanType, totalLoanAmount, interestRate, loanTenureMonths, emiAmount, startDate, nextDueDate, remainingAmount, totalInterestPaid } = req.body;

  if (!loanName || !loanType || totalLoanAmount === undefined || interestRate === undefined || loanTenureMonths === undefined || !startDate || !nextDueDate) {
    return res.status(400).json({ message: 'Please enter all required fields: Loan Name, Type, Amount, Rate, Tenure, Start Date, Next Due Date' });
  }

  // Agar EMI amount provide nahi ki gayi hai, toh calculate karein
  let finalEmiAmount = emiAmount;
  if (finalEmiAmount === undefined || finalEmiAmount === null || finalEmiAmount <= 0) {
    finalEmiAmount = calculateEmi(totalLoanAmount, interestRate, loanTenureMonths);
    if (isNaN(finalEmiAmount) || finalEmiAmount === 0) {
        return res.status(400).json({ message: 'Could not calculate EMI. Check loan details.' });
    }
  }

  try {
    const newLoan = new Loan({
      user: req.user.id,
      loanName,
      loanType,
      totalLoanAmount,
      interestRate,
      loanTenureMonths,
      emiAmount: finalEmiAmount, // Calculated or provided EMI
      startDate,
      nextDueDate,
      remainingAmount: remainingAmount !== undefined ? remainingAmount : totalLoanAmount, // Agar remaining amount nahi di toh total amount
      totalInterestPaid: totalInterestPaid !== undefined ? totalInterestPaid : 0,
    });

    const loan = await newLoan.save();
    res.status(201).json(loan);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});


// @route   PUT /api/loans/:id
// @desc    Update a loan
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { loanName, loanType, totalLoanAmount, interestRate, loanTenureMonths, emiAmount, startDate, nextDueDate, remainingAmount, totalInterestPaid } = req.body;

  try {
    let loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (loan.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this loan' });
    }

    // Update fields. Agar EMI amount provide nahi ki gayi hai, toh re-calculate karein
    let updatedEmiAmount = emiAmount;
    if (updatedEmiAmount === undefined || updatedEmiAmount === null || updatedEmiAmount <= 0) {
        updatedEmiAmount = calculateEmi(totalLoanAmount, interestRate, loanTenureMonths);
        if (isNaN(updatedEmiAmount) || updatedEmiAmount === 0) {
            return res.status(400).json({ message: 'Could not calculate EMI. Check loan details.' });
        }
    }


    loan.loanName = loanName;
    loan.loanType = loanType;
    loan.totalLoanAmount = totalLoanAmount;
    loan.interestRate = interestRate;
    loan.loanTenureMonths = loanTenureMonths;
    loan.emiAmount = updatedEmiAmount; // Updated EMI
    loan.startDate = startDate;
    loan.nextDueDate = nextDueDate;
    loan.remainingAmount = remainingAmount;
    loan.totalInterestPaid = totalInterestPaid;

    await loan.save();
    res.status(200).json(loan);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/loans/:id
// @desc    Delete a loan
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (loan.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this loan' });
    }

    await Loan.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Loan removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

