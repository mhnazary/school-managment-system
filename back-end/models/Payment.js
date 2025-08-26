const mongoose = require('mongoose');
const PaymentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
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
  },
  paymentType: {
    type: String,
    enum: ['شهریه', 'پایه'],
    default: 'شهریه'
  },
  description: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);