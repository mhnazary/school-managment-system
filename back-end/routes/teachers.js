// routes/teachers.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Teacher = require('../models/Teacher');
const TeacherPayment = require('../models/TeacherPayment');

// نکته: اگر می‌خواهید نقش 'admin' هم مانند 'administrator' دسترسی حذف/ویرایش داشته باشد،
// این هِلپر را به‌کار ببرید و در پایین استفاده کنید.
const isAdmin = (user) => user && (user.role === 'administrator' || user.role === 'admin');

// @route   GET api/teachers
// @desc    Get all teachers
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.json(teachers);
  } catch (err) {
    console.error('GET /api/teachers error:', err);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/teachers
// @desc    Create a new teacher
// @access  Private
router.post('/', auth, async (req, res) => {
  const {
    firstName,
    lastName,
    fatherName,
    birthDate,
    specialization,
    degree,
    experience,
    monthlySalary,
    phone,
    email,
    address
  } = req.body;

  try {
    const newTeacher = new Teacher({
      firstName,
      lastName,
      fatherName,
      birthDate,
      specialization,
      degree,
      experience,
      monthlySalary,
      phone,
      email,
      address
    });

    const teacher = await newTeacher.save();
    res.json(teacher);
  } catch (err) {
    console.error('POST /api/teachers error:', err);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/teachers/:id
// @desc    Update a teacher
// @access  Private (Administrator only)
router.put('/:id', auth, async (req, res) => {
  // اگر می‌خواهید نقش 'admin' هم مجاز باشد، از isAdmin استفاده کنید:
  // if (!isAdmin(req.user)) return res.status(403).json({ msg: 'Access denied' });

  if (req.user.role !== 'administrator') {
    return res.status(403).json({ msg: 'Access denied' });
  }

  const {
    firstName,
    lastName,
    fatherName,
    birthDate,
    specialization,
    degree,
    experience,
    monthlySalary,
    phone,
    email,
    address
  } = req.body;

  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({ msg: 'Teacher not found' });
    }

    teacher.firstName = firstName ?? teacher.firstName;
    teacher.lastName = lastName ?? teacher.lastName;
    teacher.fatherName = fatherName ?? teacher.fatherName;
    teacher.birthDate = birthDate ?? teacher.birthDate;
    teacher.specialization = specialization ?? teacher.specialization;
    teacher.degree = degree ?? teacher.degree;
    teacher.experience = experience ?? teacher.experience;
    teacher.monthlySalary = monthlySalary ?? teacher.monthlySalary;
    teacher.phone = phone ?? teacher.phone;
    teacher.email = email ?? teacher.email;
    teacher.address = address ?? teacher.address;

    await teacher.save();
    res.json(teacher);
  } catch (err) {
    console.error('PUT /api/teachers/:id error:', err);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/teachers/:id
// @desc    Delete a teacher
// @access  Private (Administrator only)
router.delete('/:id', auth, async (req, res) => {
  // اگر می‌خواهید نقش 'admin' هم مجاز باشد، از isAdmin استفاده کنید:
  // if (!isAdmin(req.user)) return res.status(403).json({ msg: 'Access denied' });

  if (req.user.role !== 'administrator') {
    return res.status(403).json({ msg: 'Access denied' });
  }

  try {
    // روش پیشنهادی: حذف مستقیم
    const teacher = await Teacher.findByIdAndDelete(req.params.id);

    if (!teacher) {
      return res.status(404).json({ msg: 'Teacher not found' });
    }

    // اگر نیاز دارید پرداخت‌های معلم هم پاک شوند (Cascade delete)،
    // این بلاک را باز کنید:
    // await TeacherPayment.deleteMany({ teacher: req.params.id });

    res.json({ msg: 'Teacher removed' });
  } catch (err) {
    console.error('DELETE /api/teachers/:id error:', err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/teachers/:id/payments
// @desc    Get teacher payments
// @access  Private
router.get('/:id/payments', auth, async (req, res) => {
  try {
    const payments = await TeacherPayment.find({ teacher: req.params.id })
      .populate('createdBy', 'username')
      .sort({ date: -1 });
    res.json(payments);
  } catch (err) {
    console.error('GET /api/teachers/:id/payments error:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;