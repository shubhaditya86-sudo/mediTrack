const express = require('express');
const router = express.Router();
const {
  getSchedules,
  addSchedule,
  updateSchedule,
  deleteSchedule,
} = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getSchedules)
  .post(addSchedule);

router.route('/:id')
  .put(updateSchedule)
  .delete(deleteSchedule);

module.exports = router;
