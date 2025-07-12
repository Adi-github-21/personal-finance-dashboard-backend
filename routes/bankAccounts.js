const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const BankAccount = require('../models/BankAccount'); 

//GET /api/bankaccounts (login user ka bank account fetech karne kam aaega)
router.get('/',protect,async(req,res)=> {
    try{
        const BankAccounts = await BankAccount.find({ user: req.user.id });
        res.status(200).json(BankAccounts);
    }catch(error){
       console.error(error.message);
       res.status(500).send('Server error');
    }
} );

//POST /api/banaccounts (add new bank account);
router.post('/', protect, async(req,res) => {
    const {bankName, accountType , balance , currency} = req.body;

    if(!bankName || !accountType || balance == undefined || balance == null || !currency){
        return res.status(400).json({message: 'Please enter all fields '});
    }

    try{
        const newBankAccount = new BankAccount({
            user: req.user.id,
            bankName, 
            accountType , 
            balance , 
            currency,
        });

        const bankAccount = await newBankAccount.save();
        res.status(201).json(bankAccount);
    }catch(error){
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

//PUT /api/bankaccounts/:id (update karne ke liye bank account);
router.put('/:id', protect ,async(req,res) => {
    const {bankName, accountType, balance,currency} = req.body;
    try{
        let bankAccount = await BankAccount.findById({ user: req.user.id });
        if(!bankAccount){
           return res.status(400).json({ message: "Bank account not found"});
        }
        if(bankAccount.user.toString() !== req.user.id){
            return res.status(401).json({ message: 'Not authorized to update this bank account' });
        }

        bankAccount.bankName = bankName || bankAccount.bankName;
        bankAccount.accountType = accountType || bankAccount.accountType;
        bankAccount.balance = balance !== undefined && balance !== null ? balance : bankAccount.balance;
        bankAccount.currency = currency || bankAccount.currency;

        await bankAccount.save();
        res.status(200).json(bankAccount);
    }catch(error){
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

//DELETE /api/bankaccounts (delete karne ke liye)
router.delete('/:id', protect, async(req,res) => {
    try{
        const bankAccount = await BankAccount.findById({user: req.user.id });
        if(!bankAccount){
            return res.status(400).json({ message: 'Bank Account not Found'});
        }

        if (bankAccount.user.toString() !== req.user.id) {
          return res.status(401).json({ message: 'Not authorized to delete this bank account' });
        }
        await bankAccount.deleteOne(); //mongoose ka keyword hai
        res.status(200).json({message: 'Bank account removed'});
    }catch(error){
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
