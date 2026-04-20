const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true,
  },
  scheduledFor: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['taken', 'skipped', 'pending'],
    default: 'pending',
  },
  takenAt: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [300, 'Notes cannot exceed 300 characters'],
  },
}, { timestamps: true });

logSchema.index({ user: 1, scheduledFor: -1 });
logSchema.index({ user: 1, medicine: 1, scheduledFor: 1 }, { unique: true });

module.exports = mongoose.model('Log', logSchema);
