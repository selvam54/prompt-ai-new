// server.js - Main Express server entry point

require('dotenv').config(); // Load .env

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const promptRoutes = require('./routes/prompt');

const app = express();

// ── Middleware ─────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/prompt', promptRoutes);

// ── HTML Pages ─────────────────────────────────────────
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'public/index.html'))
);
app.get('/login', (req, res) =>
  res.sendFile(path.join(__dirname, 'public/login.html'))
);
app.get('/signup', (req, res) =>
  res.sendFile(path.join(__dirname, 'public/signup.html'))
);
app.get('/dashboard', (req, res) =>
  res.sendFile(path.join(__dirname, 'public/dashboard.html'))
);

// ── Global Error Handler ───────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: err.message,
  });
});

// ── MongoDB Connection ─────────────────────────────────
const PORT = process.env.PORT || 5000;

// ✅ FIX HERE
const MONGO_URI = process.env.MONGODB_URI;

// 🔍 Debug
console.log("ENV CHECK:", MONGO_URI);

if (!MONGO_URI) {
  console.error("❌ MONGODB_URI not found in environment variables");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });