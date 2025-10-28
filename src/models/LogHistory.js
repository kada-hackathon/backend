const mongoose = require("mongoose");

const logHistorySchema = new mongoose.Schema({
  message: { type: String, required: true },
  datetime: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

module.exports = mongoose.model("LogHistory", logHistorySchema);
