// controllers/promptController.js - Handles prompt generation and history
const Groq = require('groq-sdk');
const Prompt = require('../models/Prompt');

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// System prompt for transforming casual input into structured AI prompts
const SYSTEM_PROMPT = `You are an expert AI Prompt Engineer. Your job is to transform casual, informal, or slang user inputs (including regional languages like Tamil, Hindi, etc.) into professional, structured AI prompts using the Prompt Engineering framework.

Analyze the user's intent and return a JSON response with EXACTLY this structure:
{
  "promptType": "one of: Creative, Technical, Analytical, Conversational, Educational, Business, Other",
  "promptStyle": "one of: Role-based, Step-by-step, Few-shot, Structured",
  "recommendedAI": "one of: ChatGPT, Gemini, DeepSeek, Perplexity",
  "originalLanguage": "detected language of input, e.g. English, Tamil, Hindi, Mixed",
  "promptComponents": {
    "role": "The persona/expert the AI should act as (e.g., Act as an English tutor)",
    "task": "Clear description of what the AI needs to do",
    "tone": "The tone to use (e.g., friendly, formal, professional, casual)",
    "format": "Expected output format (e.g., bullet points, table, code, paragraph, step-by-step)",
    "constraints": "Any limitations or special instructions (e.g., keep it simple, beginner-friendly, max 200 words)"
  },
  "generatedPrompt": "The full structured prompt combining all components in a clean, professional format"
}

Rules:
- promptType should reflect the nature of the request
- promptStyle should match the best approach:
  * Role-based: when a specific expert persona helps (tutor, developer, chef)
  * Step-by-step: when instructions or processes are needed
  * Few-shot: when examples would help (writing, coding patterns)
  * Structured: when JSON/table/organized output is needed
- recommendedAI:
  * ChatGPT: general tasks, creative writing, coding
  * Gemini: multimodal tasks, research, analysis
  * DeepSeek: complex reasoning, mathematics, coding
  * Perplexity: real-time information, research, news
- generatedPrompt must be the full combined prompt using all 5 components clearly formatted
- Keep your response ONLY as valid JSON, no extra text`;

// @route  POST /api/prompt/generate
// @access Private
const generatePrompt = async (req, res) => {
  try {
    const { input, preferredAI } = req.body;

    if (!input || input.trim().length === 0) {
      return res.status(400).json({ message: 'Please provide input text' });
    }

    // Call Groq API
    const userMessage = preferredAI
      ? `User input: "${input}"\nPreferred AI: ${preferredAI}`
      : `User input: "${input}"`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const rawResponse = completion.choices[0]?.message?.content;
    if (!rawResponse) {
      return res.status(500).json({ message: 'No response from AI service' });
    }

    // Parse JSON response
    let parsed;
    try {
      const jsonMatch = rawResponse.match(/```json\n?([\s\S]*?)\n?```/) ||
                        rawResponse.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : rawResponse;
      parsed = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      parsed = {
        promptType: 'Other',
        promptStyle: 'Role-based',
        recommendedAI: preferredAI || 'ChatGPT',
        originalLanguage: 'English',
        promptComponents: {
          role: 'AI Assistant',
          task: input,
          tone: 'helpful',
          format: 'paragraph',
          constraints: 'Be clear and concise',
        },
        generatedPrompt: rawResponse,
      };
    }

    // Save to database
    const savedPrompt = await Prompt.create({
      userId: req.user._id,
      originalInput: input,
      generatedPrompt: parsed.generatedPrompt,
      promptType: parsed.promptType || 'Other',
      recommendedAI: parsed.recommendedAI || preferredAI || 'ChatGPT',
    });

    res.json({
      message: 'Prompt generated successfully',
      prompt: {
        id: savedPrompt._id,
        originalInput: savedPrompt.originalInput,
        generatedPrompt: savedPrompt.generatedPrompt,
        promptType: savedPrompt.promptType,
        recommendedAI: savedPrompt.recommendedAI,
        promptStyle: parsed.promptStyle || 'Role-based',
        originalLanguage: parsed.originalLanguage || 'English',
        promptComponents: parsed.promptComponents || {},
        createdAt: savedPrompt.createdAt,
      },
    });
  } catch (error) {
    console.error('Generate prompt error:', error.message);

    if (error.status === 401) {
      return res.status(500).json({ message: 'Invalid Groq API key. Please check your .env file.' });
    }

    res.status(500).json({ message: 'Error generating prompt', error: error.message });
  }
};

// @route  GET /api/prompt/history
// @access Private
const getHistory = async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;

    const query = { userId: req.user._id };
    if (type && type !== 'All') query.promptType = type;

    const prompts = await Prompt.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Prompt.countDocuments(query);

    res.json({
      prompts,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get history error:', error.message);
    res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
};

// @route  DELETE /api/prompt/:id
// @access Private
const deletePrompt = async (req, res) => {
  try {
    const prompt = await Prompt.findOne({ _id: req.params.id, userId: req.user._id });

    if (!prompt) {
      return res.status(404).json({ message: 'Prompt not found or unauthorized' });
    }

    await prompt.deleteOne();
    res.json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    console.error('Delete prompt error:', error.message);
    res.status(500).json({ message: 'Error deleting prompt', error: error.message });
  }
};

module.exports = { generatePrompt, getHistory, deletePrompt };
