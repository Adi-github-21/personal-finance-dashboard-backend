// personal-finance-dashboard-backend/routes/google.js
const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const googleOAuth2Client = require('../config/googleAuth');
const { protect } = require('../middleware/authMiddleware');
const GoogleToken = require('../models/GoogleToken');
const Expense = require('../models/Expense'); // Expenses save karne ke liye

// Gmail API scopes
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/gmail.modify' // Add this line
];

// @route   GET /api/google/connect
// @desc    Initiate Google OAuth flow
// @access  Private
router.get('/connect', protect, (req, res) => {
  const authUrl = googleOAuth2Client.generateAuthUrl({
    access_type: 'offline', // Refresh token prapt karne ke liye
    scope: SCOPES,
    prompt: 'consent', // Har baar consent prompt karein
    state: req.user.id, // User ID ko state parameter mein bhejein
  });
  res.redirect(authUrl);
});

// @route   GET /api/google/callback
// @desc    Handle Google OAuth callback and save tokens
// @access  Public (Google se redirect hota hai)
router.get('/callback', async (req, res) => {
  const { code, state } = req.query; // 'state' mein user ID hogi

  if (!code) {
    return res.status(400).send('Authorization code missing.');
  }
  if (!state) {
    return res.status(400).send('User ID (state) missing from callback.');
  }

  try {
    const { tokens } = await googleOAuth2Client.getToken(code);
    googleOAuth2Client.setCredentials(tokens);

    // Fetch user's email to verify (optional but good practice)
    const oauth2 = google.oauth2({
      auth: googleOAuth2Client,
      version: 'v2',
    });
    const { data } = await oauth2.userinfo.get();
    console.log(`Connected Google account: ${data.email} for user ID: ${state}`);

    // Save/Update tokens in database
    await GoogleToken.findOneAndUpdate(
      { user: state },
      {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token, // Refresh token sirf pehli baar milta hai
        scope: tokens.scope,
        tokenType: tokens.token_type,
        expiryDate: new Date(tokens.expiry_date),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true } // Agar nahi hai toh banao, hai toh update karo
    );

    // Redirect to frontend dashboard or a success page
    res.redirect(`${process.env.FRONTEND_URL}/expense-tracking?google_connected=true`); // Frontend URL .env mein define karein
  } catch (error) {
    console.error('Error retrieving access token:', error.message);
    res.status(500).send('Error connecting Google account.');
  }
});

// Helper: Access token ko refresh karein agar expired ho gaya hai
const refreshAccessToken = async (googleTokenDoc) => {
    if (!googleTokenDoc.refreshToken) {
        throw new Error('No refresh token available. User needs to re-authenticate.');
    }
    googleOAuth2Client.setCredentials({
        refresh_token: googleTokenDoc.refreshToken,
    });
    const { credentials } = await googleOAuth2Client.refreshAccessToken();
    
    // Update token in DB
    googleTokenDoc.accessToken = credentials.access_token;
    googleTokenDoc.expiryDate = new Date(credentials.expiry_date);
    await googleTokenDoc.save();
    
    return credentials.access_token;
};


// @route   GET /api/google/sync-expenses
// @desc    Fetch and parse UPI/Credit Card emails from Gmail
// @access  Private
router.get('/sync-expenses', protect, async (req, res) => {
  try {
    const googleTokenDoc = await GoogleToken.findOne({ user: req.user.id });

    if (!googleTokenDoc) {
      return res.status(400).json({ message: 'Google account not connected. Please connect your account first.' });
    }

    let accessToken = googleTokenDoc.accessToken;

    // Check if access token is expired
    if (new Date() >= googleTokenDoc.expiryDate) {
      console.log('Access token expired, refreshing...');
      accessToken = await refreshAccessToken(googleTokenDoc); // Token refresh karein
    }
    
    googleOAuth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: googleOAuth2Client });

    // Search for UPI/Credit Card transaction emails
    // Example query: 'from:bank@email.com OR from:upi@email.com subject:"transaction" after:2023/01/01'
    // For simplicity, let's search for some common transaction keywords
    const searchQuery = 'subject:"transaction" OR subject:"payment" OR subject:"spent" category:primary -is:spam'; // -is:spam to avoid spam

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: searchQuery,
      maxResults: 50, // Ek baar mein 50 emails fetch karein
    });

    const messages = response.data.messages;
    if (!messages || messages.length === 0) {
      return res.status(200).json({ message: 'No new transaction emails found.' });
    }

    const newExpenses = [];
    for (const message of messages) {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full', // Full message content
      });

      const emailPayload = msg.data.payload;
      const headers = emailPayload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';
      const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString();

      let emailBody = '';
      if (emailPayload.parts) {
        // Find the HTML or plain text part
        const htmlPart = emailPayload.parts.find(part => part.mimeType === 'text/html');
        const plainTextPart = emailPayload.parts.find(part => part.mimeType === 'text/plain');
        emailBody = Buffer.from((htmlPart || plainTextPart)?.body?.data || '', 'base64').toString('utf8');
      } else if (emailPayload.body && emailPayload.body.data) {
        emailBody = Buffer.from(emailPayload.body.data, 'base64').toString('utf8');
      }

      // --- Basic Regex for Transaction Parsing (This is highly simplified) ---
      // Real-world scenario mein bahut sare regex patterns lagte hain
      let amount = 0;
      let description = subject; // Default description subject line
      let category = 'Other'; // Default category

      // Example Regex patterns (बहुत ही बेसिक, आपको इन्हें अपनी ज़रूरतों के हिसाब से refine करना होगा)
      const amountRegex = /(?:INR|Rs\.?|₹)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/i;
      const paidToRegex = /(?:paid to|sent to|transfer to)\s*([a-zA-Z0-9\s\.\-]+)/i;
      const merchantRegex = /(?:merchant|to|at)\s*([a-zA-Z0-9\s\.\-]+)\s*(?:on|for)/i;

      const amountMatch = emailBody.match(amountRegex) || subject.match(amountRegex);
      if (amountMatch && amountMatch[1]) {
        amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      }

      const paidToMatch = emailBody.match(paidToRegex);
      const merchantMatch = emailBody.match(merchantRegex);

      if (paidToMatch && paidToMatch[1]) {
        description = `Payment to ${paidToMatch[1].trim()}`;
        category = 'Shopping'; // Default category for payments
      } else if (merchantMatch && merchantMatch[1]) {
        description = `Purchase at ${merchantMatch[1].trim()}`;
        category = 'Shopping';
      } else {
        description = subject.substring(0, 100); // Subject ka pehla hissa
      }

      // Agar amount > 0 hai aur yeh pehle se save nahi hua hai
      if (amount > 0) {
        // Check if this expense already exists to avoid duplicates
        const existingExpense = await Expense.findOne({
          user: req.user.id,
          amount: amount,
          description: description,
          transactionDate: new Date(date), // Exact date match
          source: 'Automated'
        });

        if (!existingExpense) {
          const newExpense = new Expense({
            user: req.user.id,
            amount,
            category,
            description,
            transactionDate: new Date(date),
            source: 'Automated',
            // originalEmailSubject: subject, // Debugging ke liye
            // originalEmailBody: emailBody.substring(0, 500), // Debugging ke liye
          });
          await newExpense.save();
          newExpenses.push(newExpense);

          // Optional: Mark email as read or move to a specific label in Gmail
          // await gmail.users.messages.modify({
          //   userId: 'me',
          //   id: message.id,
          //   resource: { addLabelIds: ['READ'] }
          // });
        }
      }
    }

    res.status(200).json({
      message: `${newExpenses.length} new expenses synced from Gmail.`,
      syncedExpenses: newExpenses,
    });
  } catch (error) {
    console.error('Error syncing expenses from Gmail:', error.message);
    // Agar token expired hai, toh user ko re-authenticate karne ke liye kahin
    if (error.message.includes('invalid_grant') || error.message.includes('Token has been expired or revoked')) {
        res.status(401).json({ message: 'Google token expired or revoked. Please reconnect your Google account.' });
    } else {
        res.status(500).send('Error syncing expenses from Gmail.');
    }
  }
});

module.exports = router;