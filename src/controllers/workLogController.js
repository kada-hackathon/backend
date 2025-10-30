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

exports.deleteWorkLog = async (req, res) => {
  try {
    const worklog = await WorkLog.findById(req.params.id);

    if (!worklog) {
      return res.status(404).json({ message: "WorkLog not found" });
    }

    // Hanya pemilik yang bisa hapus
    if (worklog.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not allowed to delete this worklog" });
    }

    await worklog.deleteOne();
    res.status(200).json({ message: "WorkLog deleted successfully" });
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

exports.getVersions = async (req, res) => {
  try {
    // Cari WorkLog berdasarkan ID
    const worklog = await WorkLog.findById(req.params.id).populate("log_history");
    if (!worklog) {
      return res.status(404).json({ message: "WorkLog not found" });
    }

    // Validasi agar hanya owner atau collaborator yang bisa melihat versi
    const isOwner = worklog.user.toString() === req.user._id.toString();
    const isCollaborator = worklog.collaborators.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: "You are not allowed to view these versions" });
    }

    // Ambil log history dengan data user
    const versions = await LogHistory.find({ _id: { $in: worklog.log_history } })
      .populate("user", "name email division profile_photo")
      .sort({ datetime: -1 });

    res.status(200).json({ worklog_id: worklog._id, title: worklog.title, versions });
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

// GET Collaborators
exports.getCollaborators = async (req, res) => {
  try {
    const log = await WorkLog.findById(req.params.id).populate(
      "collaborators",
      "name email division role"
    );
    if (!log) return res.status(404).json({ message: "WorkLog not found" });

    res.json({
      message: "Collaborators retrieved successfully",
      collaborators: log.collaborators,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE Collaborator
exports.deleteCollaborator = async (req, res) => {
  try {
    const { collaboratorId } = req.params;
    const log = await WorkLog.findById(req.params.id);

    if (!log) return res.status(404).json({ message: "WorkLog not found" });

    // Cek apakah user pemilik log
    if (log.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Hapus kolaborator
    log.collaborators = log.collaborators.filter(
      (id) => id.toString() !== collaboratorId
    );
    await log.save();

    res.json({
      message: "Collaborator removed successfully",
      collaborators: log.collaborators,
    });
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
    .populate("user", "name email division profile_photo profilePicture dateOfJoin join_date")
    .populate("collaborators", "name email division")
    .sort({ datetime: -1 });
  res.json(logs);
};

// GET all worklogs dengan populated user data
exports.getAllWorkLogs = async (req, res) => {
  try {
    const logs = await WorkLog.find()
      .populate("user", "name email division profile_photo profilePicture dateOfJoin join_date")
      .populate("collaborators", "name email division")
      .sort({ datetime: -1 });
    res.json({ worklogs: logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET detail worklog by ID
exports.getWorkLogById = async (req, res) => {
  try {
    const worklog = await WorkLog.findById(req.params.id)
      .populate("user", "name email division profile_photo profilePicture dateOfJoin join_date")
      .populate("collaborators", "name email division");
    
    if (!worklog) {
      return res.status(404).json({ message: "WorkLog not found" });
    }
    
    res.json(worklog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
