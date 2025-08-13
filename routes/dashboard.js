// personal-finance-dashboard-backend/routes/dashboard.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Models import karein
const BankAccount = require('../models/BankAccount');
const Investment = require('../models/Investment');
const FixedDeposit = require('../models/FixedDeposit');
const Loan = require('../models/Loan');
const Debt = require('../models/Debt');
const Expense = require('../models/Expense');
const SavingGoal = require('../models/SavingGoal');

// Helper function to calculate FD Maturity Amount (Backend side)
const calculateFDMaturityAmountBackend = (principal, annualRate, tenureMonths) => {
  if (principal === undefined || annualRate === undefined || tenureMonths === undefined || tenureMonths === 0) return 0;
  const rateDecimal = annualRate / 100;
  const tenureYears = tenureMonths / 12;
  return principal * (1 + rateDecimal * tenureYears);
};

// @route   GET /api/dashboard/summary
// @desc    Get consolidated summary data for the dashboard
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    // Sabhi data ko concurrently fetch karein
    const [
      bankAccounts,
      investments,
      fixedDeposits,
      loans,
      debts,
      expenses,
      savingGoals,
    ] = await Promise.all([
      BankAccount.find({ user: req.user.id }),
      Investment.find({ user: req.user.id }),
      FixedDeposit.find({ user: req.user.id }),
      Loan.find({ user: req.user.id }),
      Debt.find({ user: req.user.id }),
      Expense.find({ user: req.user.id }),
      SavingGoal.find({ user: req.user.id }),
    ]);

    // --- Calculations for Summary & Charts ---

    // 1. Bank Accounts
    let totalBankBalance = 0;
    const bankBalanceDistribution = {}; // For Bank Balance Bar Chart
    bankAccounts.forEach(acc => {
      totalBankBalance += acc.balance;
      bankBalanceDistribution[acc.bankName] = (bankBalanceDistribution[acc.bankName] || 0) + acc.balance;
    });

    // 2. Investments
    let totalInvestmentValue = 0;
    const investmentDistribution = {}; // For Investment Bar Chart
    investments.forEach(inv => {
      const currentValue = (inv.quantity * inv.currentMarketPrice);
      totalInvestmentValue += currentValue;
      investmentDistribution[inv.stockName] = (investmentDistribution[inv.stockName] || 0) + currentValue;
    });

    // 3. Fixed Deposits
    let totalFDMaturityValue = 0;
    let totalFDPrincipal = 0;
    const fdPrincipalDistribution = {}; // For FD Pie Chart
    fixedDeposits.forEach(fd => {
      const maturityVal = calculateFDMaturityAmountBackend(fd.principalAmount, fd.interestRate, fd.tenure);
      totalFDMaturityValue += maturityVal;
      totalFDPrincipal += fd.principalAmount;
      fdPrincipalDistribution[fd.bankName] = (fdPrincipalDistribution[fd.bankName] || 0) + fd.principalAmount;
    });

    // 4. Loans (EMI Tracking)
    let totalOutstandingLoans = 0;
    let totalMonthlyEmiOutflow = 0;
    const loanTypeOutstanding = {}; // For Loan Bar Chart
    loans.forEach(loan => {
      if (loan.remainingAmount > 0) { // Sirf active loans
        totalOutstandingLoans += loan.remainingAmount;
        totalMonthlyEmiOutflow += loan.emiAmount;
        loanTypeOutstanding[loan.loanType] = (loanTypeOutstanding[loan.loanType] || 0) + loan.remainingAmount;
      }
    });

    // 5. Debts (I Owe / Owed To Me)
    let totalIOwe = 0;
    let totalOwedToMe = 0;
    const debtBreakdown = { 'I Owe': 0, 'Owed To Me': 0 }; // For Debt Pie Chart
    debts.forEach(debt => {
      if (debt.status === 'Pending') { // Sirf pending debts
        if (debt.type === 'I Owe') {
          totalIOwe += debt.amount;
          debtBreakdown['I Owe'] += debt.amount;
        } else { // Owed To Me
          totalOwedToMe += debt.amount;
          debtBreakdown['Owed To Me'] += debt.amount;
        }
      }
    });

    // 6. Expenses
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of current month

    let totalMonthlyExpense = 0;
    const expenseCategoryBreakdown = {}; // For Expense Doughnut Chart
    expenses.forEach(exp => {
      const expDate = new Date(exp.transactionDate);
      if (expDate >= startOfMonth && expDate <= endOfMonth) { // Current month ke expenses
        totalMonthlyExpense += exp.amount;
        expenseCategoryBreakdown[exp.category] = (expenseCategoryBreakdown[exp.category] || 0) + exp.amount;
      }
    });

    // 7. Saving Goals
    let totalSavingsCurrentSaved = 0;
    let totalSavingsTargetAmount = 0;
    const savingGoalProgress = {}; // For Savings Bar Chart
    savingGoals.forEach(goal => {
      if (goal.status === 'Active') { // Sirf active goals
        totalSavingsCurrentSaved += goal.currentSaved;
        totalSavingsTargetAmount += goal.targetAmount;
        savingGoalProgress[goal.goalName] = { current: goal.currentSaved, target: goal.targetAmount };
      }
    });

    // Net Worth Calculation
    const netWorth = (totalBankBalance + totalInvestmentValue + totalFDMaturityValue + totalOwedToMe + totalSavingsCurrentSaved) - (totalOutstandingLoans + totalIOwe);

    // Response object
    res.status(200).json({
      summary: {
        netWorth,
        totalBankBalance,
        totalInvestmentValue,
        totalFDPrincipal, // Added for summary card
        totalFDMaturityValue,
        totalOutstandingLoans,
        totalIOwe,
        totalOwedToMe,
        totalMonthlyExpense,
        totalMonthlyEmiOutflow,
        totalSavingsCurrentSaved,
        totalSavingsTargetAmount,
      },
      chartsData: {
        expenseCategoryBreakdown,
        investmentDistribution,
        bankBalanceDistribution, // Naya chart data
        fdPrincipalDistribution, // Naya chart data
        loanTypeOutstanding,     // Naya chart data
        debtBreakdown,           // Naya chart data
        savingGoalProgress,      // Naya chart data
      },
    });

  } catch (error) {
    console.error(`Dashboard Summary Error: ${error.message}`); // More specific error logging
    res.status(500).send('Server error');
  }
});

module.exports = router;