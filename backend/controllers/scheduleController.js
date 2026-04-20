const Schedule = require('../models/Schedule');
const Medicine = require('../models/Medicine');

// @desc    Get all schedules for logged-in user
// @route   GET /api/schedules
// @access  Private
const getSchedules = async (req, res, next) => {
  try {
    const schedules = await Schedule.find({ user: req.user.id })
      .populate('medicine', 'name dosage unit color category active')
      .sort({ createdAt: -1 });
    res.json(schedules);
  } catch (err) {
    next(err);
  }
};

// @desc    Add a schedule
// @route   POST /api/schedules
// @access  Private
const addSchedule = async (req, res, next) => {
  try {
    const { medicine, times, daysOfWeek, startDate, endDate } = req.body;

    if (!medicine || !times || times.length === 0) {
      return res.status(400).json({ message: 'Medicine and at least one time are required' });
    }

    // Verify medicine belongs to user
    const med = await Medicine.findOne({ _id: medicine, user: req.user.id });
    if (!med) return res.status(404).json({ message: 'Medicine not found' });

    const schedule = await Schedule.create({
      user: req.user.id,
      medicine,
      times,
      daysOfWeek: daysOfWeek || [],
      startDate: startDate || Date.now(),
      endDate: endDate || null,
    });

    await schedule.populate('medicine', 'name dosage unit color category');
    res.status(201).json(schedule);
  } catch (err) {
    next(err);
  }
};

// @desc    Update a schedule
// @route   PUT /api/schedules/:id
// @access  Private
const updateSchedule = async (req, res, next) => {
  try {
    let schedule = await Schedule.findById(req.params.id);

    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    if (schedule.user.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('medicine', 'name dosage unit color category');

    res.json(schedule);
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a schedule
// @route   DELETE /api/schedules/:id
// @access  Private
const deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    if (schedule.user.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    await schedule.deleteOne();
    res.json({ message: 'Schedule removed' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSchedules, addSchedule, updateSchedule, deleteSchedule };
