const Medicine = require('../models/Medicine');

// @desc    Get all medicines for logged-in user
// @route   GET /api/medicines
// @access  Private
const getMedicines = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(medicines);
  } catch (err) {
    next(err);
  }
};

// @desc    Add a medicine
// @route   POST /api/medicines
// @access  Private
const addMedicine = async (req, res, next) => {
  try {
    const { name, dosage, unit, category, color, notes } = req.body;

    if (!name || !dosage) {
      return res.status(400).json({ message: 'Name and dosage are required' });
    }

    const medicine = await Medicine.create({
      user: req.user.id,
      name,
      dosage,
      unit,
      category,
      color,
      notes,
    });

    res.status(201).json(medicine);
  } catch (err) {
    next(err);
  }
};

// @desc    Update a medicine
// @route   PUT /api/medicines/:id
// @access  Private
const updateMedicine = async (req, res, next) => {
  try {
    let medicine = await Medicine.findById(req.params.id);

    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    if (medicine.user.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(medicine);
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a medicine
// @route   DELETE /api/medicines/:id
// @access  Private
const deleteMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    if (medicine.user.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    await medicine.deleteOne();
    res.json({ message: 'Medicine removed' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMedicines, addMedicine, updateMedicine, deleteMedicine };
