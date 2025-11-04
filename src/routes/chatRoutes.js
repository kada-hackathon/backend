const express = require("express");
const router = express.Router();
const {
  saveChatSession,
  getChatHistory,
  getChatSession,
  deleteChatSession
} = require("../controllers/chatController");
const { protect } = require("../middlewares/authMiddleware");

// Chat Routes
router.post("/save", protect, saveChatSession);  // POST save/update chat session
router.get("/history", protect, getChatHistory);  // GET chat history
router.get("/:session_id", protect, getChatSession);  // GET specific chat session
router.delete("/:session_id", protect, deleteChatSession);  // DELETE chat session

module.exports = router;
