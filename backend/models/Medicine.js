const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required'],
    trim: true,
  },
  unit: {
    type: String,
    default: 'mg',
    trim: true,
  },
  category: {
    type: String,
    default: 'General',
    trim: true,
  },
  color: {
    type: String,
    default: '#805ad5',
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
  active: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

medicineSchema.index({ user: 1, active: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
