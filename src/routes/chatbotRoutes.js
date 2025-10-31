const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { postMessageChatbot, getMessagesChatbot } = require('../controllers/chatbotController') 


//get session_id for each chatbot
// router.get('/:session_id/', getMessagesChatbot);
router.get('/session/:session_id', protect, getMessagesChatbot);

//post the message to chatbot
// router.post('/', postMessageChatbot);
router.post('/', protect, postMessageChatbot);

module.exports = router;