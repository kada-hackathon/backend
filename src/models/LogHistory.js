const mongoose = require("mongoose");

const logHistorySchema = new mongoose.Schema({
  message: { type: String, required: true },
  datetime: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // NEW:
  snapshot: {
    type: mongoose.Schema.Types.Mixed, // Object or Mixed
    required: true
  }
});

module.exports = mongoose.model("LogHistory", logHistorySchema);
