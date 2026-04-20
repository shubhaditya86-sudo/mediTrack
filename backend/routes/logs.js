const express = require('express');
const router = express.Router();
const {
  getTodayLogs,
  getLogs,
  updateLog,
  getStats,
} = require('../controllers/logController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/today', getTodayLogs);
router.get('/stats', getStats);
router.route('/').get(getLogs).post(updateLog);

module.exports = router;
