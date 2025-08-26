const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');

// @route   GET api/expenses
// @desc    Get all expenses
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { month, year, category } = req.query;
    const query = {};
    
    if (month) query.month = month;
    if (year) query.year = year;
    if (category) query.category = category;
    
    const expenses = await Expense.find(query).sort({ createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/expenses
// @desc    Add a new expense
// @access  Private
router.post('/', auth, async (req, res) => {
  const { title, amount, category, month, year, description } = req.body;
  
  try {
    const newExpense = new Expense({
      title,
      amount,
      category,
      month,
      year,
      description,
      createdBy: req.user.id
    });
    
    const expense = await newExpense.save();
    res.json(expense);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/expenses/:id
// @desc    Update an expense
// @access  Private (Administrator only)
router.put('/:id', auth, async (req, res) => {
  const { title, amount, category, month, year, description } = req.body;
  
  try {
    let expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ msg: 'Expense not found' });
    }
    
    // Check if user is administrator
    if (req.user.role !== 'administrator') {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { $set: { title, amount, category, month, year, description } },
      { new: true }
    );
    
    res.json(expense);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/expenses/:id
// @desc    Delete an expense
// @access  Private (Administrator only)
router.delete('/:id', auth, async (req, res) => {
  try {
    let expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ msg: 'Expense not found' });
    }
    
    // Check if user is administrator
    if (req.user.role !== 'administrator') {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Use findByIdAndDelete instead of findByIdAndRemove
    await Expense.findByIdAndDelete(req.params.id);
    
    res.json({ msg: 'Expense removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;