const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
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
  // e.g. ["08:00", "14:00", "20:00"]
  times: {
    type: [String],
    required: [true, 'At least one time is required'],
    validate: {
      validator: (v) => v.length > 0,
      message: 'At least one time is required',
    },
  },
  // 0=Sun, 1=Mon, ..., 6=Sat. Empty array means every day.
  daysOfWeek: {
    type: [Number],
    default: [],
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    default: null,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

scheduleSchema.index({ user: 1, medicine: 1 });
scheduleSchema.index({ user: 1, active: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
