const WorkLog = require("../models/WorkLog");
const LogHistory = require("../models/LogHistory");
const User = require("../models/User");

exports.addWorkLog = async (req, res) => {
  try {
    const { title, content, tag, media } = req.body;
    const log = await WorkLog.create({
      title, content, tag, media, user: req.user._id
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.editWorkLog = async (req, res) => {
  try {
    const log = await WorkLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Not found" });

    const updated = await WorkLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    // Simpan versi lama
    await LogHistory.create({
      message: `Edited post: ${log.title}`,
      user: req.user._id
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addVersion = async (req, res) => {
  try {
    const { message } = req.body;
    const log = await WorkLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Not found" });

    const version = await LogHistory.create({
      message,
      user: req.user._id
    });
    log.log_history.push(version._id);
    await log.save();
    res.json(version);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addCollaborator = async (req, res) => {
  try {
    const { email } = req.body;
    const collaborator = await User.findOne({ email });
    if (!collaborator) return res.status(404).json({ message: "User not found" });

    const log = await WorkLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "WorkLog not found" });

    if (!log.collaborators.includes(collaborator._id)) {
      log.collaborators.push(collaborator._id);
      await log.save();
    }

    res.json({ message: "Collaborator added", log });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.filterWorkLogs = async (req, res) => {
  const { from, to, tag } = req.query;
  let filter = {};

  if (from && to) filter.datetime = { $gte: new Date(from), $lte: new Date(to) };
  if (tag) filter.tag = { $in: tag.split(",") };

  const logs = await WorkLog.find(filter)
    .populate("user", "name division")
    .populate("collaborators", "name");
  res.json(logs);
};
