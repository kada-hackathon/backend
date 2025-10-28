const express = require("express");
const router = express.Router();
const {
  addWorkLog,
  editWorkLog,
  deleteWorkLog,
  addVersion,
  getVersions,
  addCollaborator,
  getCollaborators,
  deleteCollaborator,
  filterWorkLogs,
} = require("../controllers/workLogController");
const { protect } = require("../middlewares/authMiddleware");

// Worklog Routes
router.post("/", protect, addWorkLog);
router.put("/:id", protect, editWorkLog);
router.delete("/:id", protect, deleteWorkLog);

// Version Routes
router.post("/:id/versions", protect, addVersion);
router.get("/:id/versions", protect, getVersions);

// Collaborator Routes
router.post("/:id/collaborators", protect, addCollaborator);
router.get("/:id/collaborators", protect, getCollaborators);
router.delete("/:id/collaborators/:collaboratorId", protect, deleteCollaborator);

// Worklog Filter Routes
router.get("/", protect, filterWorkLogs);

module.exports = router;
