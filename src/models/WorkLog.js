const mongoose = require("mongoose");

const workLogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String },
  tag: [{ type: String }],
  media: [{ type: String }],
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  datetime: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  log_history: [{ type: mongoose.Schema.Types.ObjectId, ref: "LogHistory" }]
});

module.exports = mongoose.model("WorkLog", workLogSchema);
