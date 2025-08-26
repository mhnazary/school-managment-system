const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  fatherName: {
    type: String,
    required: true
  },
  birthDate: {
    type: Date,
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  degree: {
    type: String,
    required: true
  },
  experience: {
    type: Number,
    required: true
  },
  monthlySalary: {
    type: Number,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  address: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Teacher || mongoose.model('Teacher', TeacherSchema);