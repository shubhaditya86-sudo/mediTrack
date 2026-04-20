const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/logs',      require('./routes/logs'));

app.get('/', (_req, res) => res.json({ message: 'Medicine Tracker API is running 🚀' }));

// 404
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
});
