const mongoose = require('mongoose');
const StudentSchema = new mongoose.Schema({
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
  grandfatherName: {
    type: String,
    required: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  birthDate: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['پسر', 'دختر'],
    required: true
  },
  parentPhone: {
    type: String,
    required: true
  },
  address: {
    type: String
  },
  status: {
    type: String,
    enum: ['فعال', 'فارغ', 'ترک‌تحصیل'],
    default: 'فعال'
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  baseFee: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Student || mongoose.model('Student', StudentSchema);