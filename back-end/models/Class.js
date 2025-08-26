const mongoose = require('mongoose');
const ClassSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
module.exports = mongoose.models.Class || mongoose.model('Class', ClassSchema);