const mongoose = require('mongoose');
const TeacherPaymentSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  installment: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  method: {
    type: String,
    enum: ['نقدی', 'بانکی', 'آنلاین'],
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// اضافه کردن ایندکس یکتا برای جلوگیری از پرداخت‌های تکراری در یک ماه
TeacherPaymentSchema.index({ teacher: 1, installment: 1 }, { unique: true });

module.exports = mongoose.models.TeacherPayment || mongoose.model('TeacherPayment', TeacherPaymentSchema);