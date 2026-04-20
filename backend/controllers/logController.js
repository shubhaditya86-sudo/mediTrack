const Log = require('../models/Log');
const Schedule = require('../models/Schedule');

// Helper: start and end of a given date
const dayBounds = (date) => {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return { start, end };
};

// @desc    Get today's dose list (derived from active schedules)
// @route   GET /api/logs/today
// @access  Private
const getTodayLogs = async (req, res, next) => {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const { start: startOfDay, end: endOfDay } = dayBounds(now);

    // Fetch all active schedules whose period covers today
    const schedules = await Schedule.find({
      user: req.user.id,
      active: true,
      startDate: { $lte: endOfDay },
      $or: [
        { endDate: null },
        { endDate: { $exists: false } },
        { endDate: { $gte: startOfDay } },
      ],
    }).populate('medicine', 'name dosage unit color category active notes');

    // Filter by day of week (empty = every day)
    const todaySchedules = schedules.filter(
      (s) => s.daysOfWeek.length === 0 || s.daysOfWeek.includes(dayOfWeek)
    );

    // Fetch all logs for today
    const todayLogs = await Log.find({
      user: req.user.id,
      scheduledFor: { $gte: startOfDay, $lte: endOfDay },
    });

    const logMap = {};
    todayLogs.forEach((l) => {
      const key = `${l.medicine}_${l.scheduledFor.toISOString()}`;
      logMap[key] = l;
    });

    // Build result entries per schedule+time
    const result = [];
    for (const schedule of todaySchedules) {
      if (!schedule.medicine || !schedule.medicine.active) continue;

      for (const time of schedule.times) {
        const [h, m] = time.split(':').map(Number);
        const scheduledFor = new Date(startOfDay);
        scheduledFor.setHours(h, m, 0, 0);

        const key = `${schedule.medicine._id}_${scheduledFor.toISOString()}`;
        const log = logMap[key] || null;

        result.push({
          scheduleId: schedule._id,
          medicine: schedule.medicine,
          time,
          scheduledFor,
          logId: log ? log._id : null,
          status: log ? log.status : 'pending',
          takenAt: log ? log.takenAt : null,
          notes: log ? log.notes : '',
        });
      }
    }

    result.sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// @desc    Get log history (filterable)
// @route   GET /api/logs?from=&to=&medicine=
// @access  Private
const getLogs = async (req, res, next) => {
  try {
    const { from, to, medicine } = req.query;

    const query = { user: req.user.id };

    if (from || to) {
      query.scheduledFor = {};
      if (from) query.scheduledFor.$gte = new Date(from);
      if (to)   query.scheduledFor.$lte = new Date(to);
    }

    if (medicine) query.medicine = medicine;

    const logs = await Log.find(query)
      .populate('medicine', 'name color dosage unit')
      .sort({ scheduledFor: -1 })
      .limit(200);

    res.json(logs);
  } catch (err) {
    next(err);
  }
};

// @desc    Create or update a log entry (mark taken / skipped)
// @route   POST /api/logs
// @access  Private
const updateLog = async (req, res, next) => {
  try {
    const { medicineId, scheduledFor, status, notes } = req.body;

    if (!medicineId || !scheduledFor || !status) {
      return res.status(400).json({ message: 'medicineId, scheduledFor and status are required' });
    }

    const scheduledDate = new Date(scheduledFor);

    let log = await Log.findOne({
      user: req.user.id,
      medicine: medicineId,
      scheduledFor: scheduledDate,
    });

    if (log) {
      log.status = status;
      log.notes = notes || log.notes;
      log.takenAt = status === 'taken' ? new Date() : log.takenAt;
      await log.save();
    } else {
      log = await Log.create({
        user:         req.user.id,
        medicine:     medicineId,
        scheduledFor: scheduledDate,
        status,
        notes:        notes || '',
        takenAt:      status === 'taken' ? new Date() : null,
      });
    }

    res.json(log);
  } catch (err) {
    next(err);
  }
};

// @desc    Get adherence stats
// @route   GET /api/logs/stats
// @access  Private
const getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const { start: startToday, end: endToday } = dayBounds(now);

    const sevenDaysAgo  = new Date(startToday); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const thirtyDaysAgo = new Date(startToday); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const [todayLogs, weekLogs, monthLogs] = await Promise.all([
      Log.find({ user: req.user.id, scheduledFor: { $gte: startToday, $lte: endToday } }),
      Log.find({ user: req.user.id, scheduledFor: { $gte: sevenDaysAgo, $lte: endToday } }),
      Log.find({ user: req.user.id, scheduledFor: { $gte: thirtyDaysAgo, $lte: endToday } }),
    ]);

    const calc = (logs) => {
      const decided = logs.filter((l) => l.status !== 'pending');
      const taken   = logs.filter((l) => l.status === 'taken').length;
      return {
        total:    logs.length,
        taken:    taken,
        skipped:  logs.filter((l) => l.status === 'skipped').length,
        pending:  logs.filter((l) => l.status === 'pending').length,
        adherence: decided.length > 0 ? Math.round((taken / decided.length) * 100) : 0,
      };
    };

    res.json({
      today: calc(todayLogs),
      week:  calc(weekLogs),
      month: calc(monthLogs),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTodayLogs, getLogs, updateLog, getStats };
