const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  session_id: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  response: { 
    type: String, 
    required: true 
  },
  context_used: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Chat', chatSchema);