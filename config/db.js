const mongoose = require('mongoose'); // Mongoose library import ki

// MongoDB se connect hone ka asynchronous function
const connectDB = async () => {
  try {
    // MONGO_URI ko .env file se load karega
    // Ab options object ko bilkul simple rakhenge
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`); // Connection successful hone par message
  } catch (error) {
    console.error(`Error: ${error.message}`); // Error hone par message
    process.exit(1); // Application ko exit kar do agar connection fail ho
  }
};

module.exports = connectDB; // connectDB function ko export kar rahe hain