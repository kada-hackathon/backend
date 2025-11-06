const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  try {
    // Ambil token dari cookie atau header (case-insensitive)
    let token =
      req.cookies?.token ||
      req.headers?.authorization?.replace(/bearer\s+/i, "");

    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    // Verifikasi JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Role admin check
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only endpoint" });
  }
  next();
};

// Check if user can view a worklog (owner, collaborator, or same division)
exports.canViewWorkLog = async (req, res, next) => {
  try {
    const WorkLog = require("../models/WorkLog");
    const worklog = await WorkLog.findById(req.params.id)
      .populate('user', 'division')
      .select('user collaborators');
    
    if (!worklog) {
      return res.status(404).json({ message: "WorkLog not found" });
    }

    const isOwner = worklog.user._id.toString() === req.user._id.toString();
    const isCollaborator = worklog.collaborators.some(
      id => id.toString() === req.user._id.toString()
    );
    const sameDivision = worklog.user.division === req.user.division;

    if (!isOwner && !isCollaborator && !sameDivision) {
      return res.status(403).json({ 
        message: "Access denied: You don't have permission to view this worklog" 
      });
    }

    // Attach worklog to request for further use
    req.worklog = worklog;
    next();
  } catch (error) {
    console.error("canViewWorkLog middleware error:", error.message);
    res.status(500).json({ message: "Error checking worklog access" });
  }
};

// Check if user can edit a worklog (owner or invited collaborator)
exports.canEditWorkLog = async (req, res, next) => {
  try {
    const WorkLog = require("../models/WorkLog");
    const worklog = await WorkLog.findById(req.params.id)
      .select('user collaborators');
    
    if (!worklog) {
      return res.status(404).json({ message: "WorkLog not found" });
    }

    const isOwner = worklog.user.toString() === req.user._id.toString();
    const isCollaborator = worklog.collaborators.some(
      id => id.toString() === req.user._id.toString()
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ 
        message: "Access denied: You must be invited as a collaborator" 
      });
    }

    // Owner or invited collaborator - all have edit access
    req.worklog = worklog;
    next();
  } catch (error) {
    console.error("canEditWorkLog middleware error:", error.message);
    res.status(500).json({ message: "Error checking worklog edit access" });
  }
};
