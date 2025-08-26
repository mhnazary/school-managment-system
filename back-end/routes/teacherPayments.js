const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const TeacherPayment = require('../models/TeacherPayment');
const Teacher = require('../models/Teacher');

// @route   POST api/teacherPayments
// @desc    Create a new teacher payment
// @access  Private
router.post('/', auth, async (req, res) => {
  const { teacher, installment, amount, method } = req.body;
  
  try {
    const teacherObj = await Teacher.findById(teacher);
    if (!teacherObj) {
      return res.status(404).json({ msg: 'Teacher not found' });
    }
    
    // بررسی وجود پرداخت برای این ماه و معلم
    const existingPayment = await TeacherPayment.findOne({ teacher, installment });
    if (existingPayment) {
      return res.status(400).json({ msg: 'Payment for this month already exists' });
    }
    
    const newPayment = new TeacherPayment({
      teacher,
      installment,
      amount,
      method,
      createdBy: req.user.id
    });
    
    const payment = await newPayment.save();
    res.json(payment);
  } catch (err) {
    console.error(err.message);
    // خطای ایندکس تکراری را مدیریت می‌کنیم
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Payment for this month already exists' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/teacherPayments/:id
// @desc    Update a teacher payment
// @access  Private (Administrator only)
router.put('/:id', auth, async (req, res) => {
  // Check if user is administrator
  if (req.user.role !== 'administrator') {
    return res.status(403).json({ msg: 'Access denied' });
  }
  
  const { installment, amount, method } = req.body;
  
  try {
    const payment = await TeacherPayment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ msg: 'Payment not found' });
    }
    
    payment.installment = installment || payment.installment;
    payment.amount = amount || payment.amount;
    payment.method = method || payment.method;
    
    await payment.save();
    res.json(payment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/teacherPayments/:id
// @desc    Delete a teacher payment
// @access  Private (Administrator only)
router.delete('/:id', auth, async (req, res) => {
  // Check if user is administrator
  if (req.user.role !== 'administrator') {
    return res.status(403).json({ msg: 'Access denied' });
  }
  
  try {
    // استفاده از findByIdAndDelete به جای remove
    const payment = await TeacherPayment.findByIdAndDelete(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ msg: 'Payment not found' });
    }
    
    res.json({ msg: 'Payment removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET api/teacherPayments/teacher/:teacherId/status
// @desc    Get teacher payment status
// @access  Private
router.get('/teacher/:teacherId/status', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.teacherId);
    if (!teacher) {
      return res.status(404).json({ msg: 'Teacher not found' });
    }
    
    const payments = await TeacherPayment.find({ teacher: req.params.teacherId });
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const monthlySalary = teacher.monthlySalary;
    const remaining = monthlySalary - totalPaid;
    
    let status;
    if (remaining <= 0) {
      status = 'پرداخت‌شده';
    } else if (totalPaid > 0) {
      status = 'باقی‌مانده';
    } else {
      status = 'پرداخت‌نشده';
    }
    
    res.json({
      monthlySalary,
      totalPaid,
      remaining,
      status
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/teacherPayments/reports/monthly
// @desc    Get monthly salary report
// @access  Private
router.get('/reports/monthly', auth, async (req, res) => {
  try {
    const { year, month } = req.query;
    
    // Get all teachers
    const teachers = await Teacher.find();
    
    // For each teacher, check if they have been paid for the specified month
    const teachersWithStatus = await Promise.all(teachers.map(async (teacher) => {
      // Fix: Use exact match for year and month instead of regex
      const payments = await TeacherPayment.find({
        teacher: teacher._id,
        installment: `${year}/${month}` // Exact match instead of regex
      });
      
      const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const status = totalPaid >= teacher.monthlySalary ? 'پرداخت‌شده' : 'باقی‌مانده';
      
      return {
        ...teacher.toObject(),
        status,
        totalPaid
      };
    }));
    
    // Calculate totals
    const totalMonthlySalary = teachers.reduce((sum, teacher) => sum + teacher.monthlySalary, 0);
    const totalPaidAmount = teachersWithStatus.reduce((sum, teacher) => sum + teacher.totalPaid, 0);
    
    res.json({
      teachers: teachersWithStatus,
      totalMonthlySalary,
      totalPaidAmount,
      month,
      year
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/teacherPayments/reports/annual
// @desc    Get annual salary report
// @access  Private
router.get('/reports/annual', auth, async (req, res) => {
  try {
    const { year } = req.query;
    
    // Get all teachers
    const teachers = await Teacher.find();
    
    // For each teacher, get all payments in the specified year
    const teachersWithPayments = await Promise.all(teachers.map(async (teacher) => {
      const payments = await TeacherPayment.find({
        teacher: teacher._id,
        date: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${parseInt(year) + 1}-01-01`)
        }
      });
      
      const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const annualSalary = teacher.monthlySalary * 12;
      const status = totalPaid >= annualSalary ? 'پرداخت‌شده' : 'باقی‌مانده';
      
      return {
        ...teacher.toObject(),
        status,
        totalPaid,
        annualSalary
      };
    }));
    
    // Calculate totals
    const totalAnnualSalary = teachers.reduce((sum, teacher) => sum + (teacher.monthlySalary * 12), 0);
    const totalPaidAmount = teachersWithPayments.reduce((sum, teacher) => sum + teacher.totalPaid, 0);
    
    res.json({
      teachers: teachersWithPayments,
      totalAnnualSalary,
      totalPaidAmount,
      year
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;