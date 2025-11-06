  const express = require("express");
const router = express.Router();
const {
  addWorkLog,
  editWorkLog,
  deleteWorkLog,
  addVersion,
  getVersions,
  getLogHistoryById,
  addCollaborator,
  getCollaborators,
  deleteCollaborator,
  filterWorkLogs,
  getWorkLogById,
  getCollaborationStatus,
} = require("../controllers/workLogController");
const { protect } = require("../middlewares/authMiddleware");

// Worklog Routes
router.get("/filter", protect, filterWorkLogs);  // GET filter worklogs (MUST BE BEFORE /:id)
router.get("/:id", protect, getWorkLogById);  // GET detail worklog by ID
router.post("/", protect, addWorkLog);
router.put("/:id", protect, editWorkLog);
router.delete("/:id", protect, deleteWorkLog);

// Version Routes
router.post("/:id/versions", protect, addVersion);
router.get("/:id/versions", protect, getVersions);
router.get("/loghistory/:id", protect, getLogHistoryById);

// Collaborator Routes
router.post("/:id/collaborators", protect, addCollaborator);
router.get("/:id/collaborators", protect, getCollaborators);
router.delete("/:id/collaborators/:collaboratorId", protect, deleteCollaborator);

// Real-time Collaboration Routes
router.get("/:id/collaboration/status", protect, getCollaborationStatus);

module.exports = router;
