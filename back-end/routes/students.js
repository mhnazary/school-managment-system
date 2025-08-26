const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Student = require('../models/Student');
const Payment = require('../models/Payment');

// @route   GET api/students
// @desc    Get all students
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const students = await Student.find().populate('class', 'name academicYear');
    res.json(students);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/students/:id
// @desc    Get student by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('class', 'name academicYear');
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }
    res.json(student);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/students
// @desc    Create a new student
// @access  Private
router.post('/', auth, async (req, res) => {
  const {
    firstName,
    lastName,
    fatherName,
    grandfatherName,
    studentId,
    birthDate,
    gender,
    parentPhone,
    address,
    class: classId,
    baseFee
  } = req.body;
  
  try {
    // Check if student ID already exists
    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      return res.status(400).json({ msg: 'Student ID already exists' });
    }
    
    const newStudent = new Student({
      firstName,
      lastName,
      fatherName,
      grandfatherName,
      studentId,
      birthDate,
      gender,
      parentPhone,
      address,
      class: classId,
      baseFee: baseFee || 0
    });
    
    const student = await newStudent.save();
    
    // حذف کد ایجاد خودکار پرداخت پایه
    // فقط شهریه پایه در پروفایل دانش‌آموز ذخیره می‌شود
    // هیچ پرداختی به صورت خودکار ایجاد نمی‌شود
    
    res.json(student);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/students/:id
// @desc    Update a student
// @access  Private (Administrator only)
router.put('/:id', auth, async (req, res) => {
  // Check if user is administrator
  if (req.user.role !== 'administrator') {
    return res.status(403).json({ msg: 'Access denied' });
  }
  
  const {
    firstName,
    lastName,
    fatherName,
    grandfatherName,
    studentId,
    birthDate,
    gender,
    parentPhone,
    address,
    status,
    class: classId
  } = req.body;
  
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }
    
    // Check if student ID is being changed and already exists
    if (studentId && studentId !== student.studentId) {
      const existingStudent = await Student.findOne({ studentId });
      if (existingStudent) {
        return res.status(400).json({ msg: 'Student ID already exists' });
      }
    }
    
    student.firstName = firstName || student.firstName;
    student.lastName = lastName || student.lastName;
    student.fatherName = fatherName || student.fatherName;
    student.grandfatherName = grandfatherName || student.grandfatherName;
    student.studentId = studentId || student.studentId;
    student.birthDate = birthDate || student.birthDate;
    student.gender = gender || student.gender;
    student.parentPhone = parentPhone || student.parentPhone;
    student.address = address || student.address;
    student.status = status || student.status;
    student.class = classId || student.class;
    
    await student.save();
    res.json(student);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/students/:id
// @desc    Delete a student
// @access  Private (Administrator only)
router.delete('/:id', auth, async (req, res) => {
  // Check if user is administrator
  if (req.user.role !== 'administrator') {
    return res.status(403).json({ msg: 'Access denied' });
  }
  
  try {
    // Use findByIdAndDelete instead of find().remove()
    const student = await Student.findByIdAndDelete(req.params.id);
    
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }
    
    // Also delete all payments associated with this student
    await Payment.deleteMany({ student: req.params.id });
    
    res.json({ msg: 'Student removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/students/:id/payments
// @desc    Get student payments
// @access  Private
router.get('/:id/payments', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.params.id })
      .populate('createdBy', 'username')
      .sort({ date: -1 });
    
    res.json(payments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/students/class/:classId
// @desc    Get students by class
// @access  Private
router.get('/class/:classId', auth, async (req, res) => {
  try {
    const students = await Student.find({ class: req.params.classId })
      .populate('class', 'name academicYear');
    
    res.json(students);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;