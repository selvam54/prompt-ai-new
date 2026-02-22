// models/Prompt.js - Mongoose schema for generated prompts
const mongoose = require('mongoose');

const PromptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalInput: {
      type: String,
      required: true,
      trim: true,
    },
    generatedPrompt: {
      type: String,
      required: true,
    },
    promptType: {
      type: String,
      required: true,
      enum: ['Creative', 'Technical', 'Analytical', 'Conversational', 'Educational', 'Business', 'Other'],
    },
    recommendedAI: {
      type: String,
      default: 'ChatGPT',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prompt', PromptSchema);
