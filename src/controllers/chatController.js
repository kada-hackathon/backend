const Chat = require("../models/Chat");

// Simpan chat session baru
exports.saveChatSession = async (req, res) => {
  try {
    const { session_id, title, messages } = req.body;
    const userId = req.user._id;

    // Cek apakah session sudah ada
    let chat = await Chat.findOne({ user: userId, session_id });

    if (chat) {
      // Update existing chat
      chat.messages = messages;
      chat.updated_at = new Date();
      await chat.save();
    } else {
      // Buat chat baru
      chat = await Chat.create({
        user: userId,
        session_id,
        title,
        messages
      });
    }

    res.status(200).json({ message: "Chat saved successfully", chat });
  } catch (error) {
    console.error("Error saving chat:", error);
    res.status(500).json({ message: error.message });
  }
};

// Ambil semua chat history user
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await Chat.find({ user: userId })
      .sort({ updated_at: -1 })
      .select('session_id title messages updated_at created_at');

    res.status(200).json({ chats });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: error.message });
  }
};

// Ambil chat session berdasarkan session_id
exports.getChatSession = async (req, res) => {
  try {
    const { session_id } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findOne({ user: userId, session_id });

    if (!chat) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    res.status(200).json({ chat });
  } catch (error) {
    console.error("Error fetching chat session:", error);
    res.status(500).json({ message: error.message });
  }
};

// Hapus chat session
exports.deleteChatSession = async (req, res) => {
  try {
    const { session_id } = req.params;
    const userId = req.user._id;

    const result = await Chat.findOneAndDelete({ user: userId, session_id });

    if (!result) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    res.status(200).json({ message: "Chat session deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat session:", error);
    res.status(500).json({ message: error.message });
  }
};
