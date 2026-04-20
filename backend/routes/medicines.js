const express = require('express');
const router = express.Router();
const {
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
} = require('../controllers/medicineController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getMedicines)
  .post(addMedicine);

router.route('/:id')
  .put(updateMedicine)
  .delete(deleteMedicine);

module.exports = router;
