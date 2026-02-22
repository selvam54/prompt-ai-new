// routes/prompt.js - Prompt generation and history routes
const express = require('express');
const router = express.Router();
const { generatePrompt, getHistory, deletePrompt } = require('../controllers/promptController');
const { protect } = require('../middleware/auth');

router.post('/generate', protect, generatePrompt);
router.get('/history', protect, getHistory);
router.delete('/:id', protect, deletePrompt);

module.exports = router;
