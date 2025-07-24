const express = require('express');
const dotenv = require('dotenv'); 
const connectDB = require('./config/db'); 
const authRoutes = require('./routes/auth'); // Authentication routes import kiye
const bankAccountRoutes = require('./routes/bankAccounts');
const investmentRoutes = require('./routes/investments');
const fixedDepositRoutes = require('./routes/fixedDeposits');
const loanRoutes = require('./routes/loans');
const cors = require('cors'); // CORS middleware 
const path = require('path'); 

dotenv.config();

connectDB();

const app = express(); 

// Middleware
app.use(express.json()); // Body parser middleware: JSON request body ko parse karne ke liye
app.use(cors()); // CORS enable karo, taki frontend se requests accept ho sakein

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
// /api/auth path par authRoutes ko use karo
app.use('/api/auth', authRoutes);
app.use('/api/bankaccounts',bankAccountRoutes );
app.use('/api/investments', investmentRoutes); 
app.use('/api/fixeddeposits', fixedDepositRoutes); 
app.use('/api/loans', loanRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

// Server start karo
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
