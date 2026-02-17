const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const certificateRoute = require('./routes/certificate');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

app.use('/api', certificateRoute);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ message: 'Server is running correctly!' });
});

// Use PORT from environment if available, otherwise default to 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: DB_HOST=${process.env.DB_HOST}, DB_USER=${process.env.DB_USER}, DB_NAME=${process.env.DB_NAME}`);
});

// Handle unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
