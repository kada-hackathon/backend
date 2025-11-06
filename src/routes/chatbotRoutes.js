const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { 
    postMessageChatbot, 
    getMessagesChatbot,
    getChatHistory,
    deleteChatSession
} = require('../controllers/chatbotController');

// Get all chat history (list of sessions with metadata)
router.get('/history', protect, getChatHistory);

// Get specific session messages
router.get('/session/:session_id', protect, getMessagesChatbot);

// Delete chat session
router.delete('/session/:session_id', protect, deleteChatSession);

// Post message to chatbot
router.post('/', protect, postMessageChatbot);

module.exports = router;