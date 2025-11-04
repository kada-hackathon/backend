const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  session_id: { type: String, required: true },
  title: { type: String, required: true },
  messages: [{
    id: { type: String, required: true },
    text: { type: String, required: true },
    sender: { type: String, enum: ['user', 'bot'], required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Index untuk performa
chatSchema.index({ user: 1, session_id: 1 });
chatSchema.index({ user: 1, created_at: -1 });

module.exports = mongoose.model("Chat", chatSchema);
