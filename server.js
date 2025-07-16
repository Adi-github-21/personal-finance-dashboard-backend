const express = require('express');
const dotenv = require('dotenv'); // .env files load karne ke liye
const connectDB = require('./config/db'); // Database connection function import kiya
const authRoutes = require('./routes/auth'); // Authentication routes import kiye
const bankAccountRoutes = require('./routes/bankAccounts');
const invesmentRoutes = require('./routes/investments');
const cors = require('cors'); // CORS middleware import kiya
const path = require('path'); 

// .env file se environment variables load karo
dotenv.config();

// Database se connect karo
connectDB();

const app = express(); // Express app banayi

// Middleware
app.use(express.json()); // Body parser middleware: JSON request body ko parse karne ke liye
app.use(cors()); // CORS enable karo, taki frontend se requests accept ho sakein

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
// /api/auth path par authRoutes ko use karo
app.use('/api/auth', authRoutes);
app.use('/api/bankaccounts', bankAccountRoutes );
app.use('/api/investments', invesmentRoutes );

// Basic route for testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000; // Port number .env se ya default 5000

// Server start karo
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
