const express = require("express");
const router = express.Router();
const {
  addWorkLog, editWorkLog, addVersion, addCollaborator, filterWorkLogs
} = require("../controllers/workLogController");
const { protect } = require("../middlewares/authMiddleware.js");

router.post("/", protect, addWorkLog);
router.put("/:id", protect, editWorkLog);
router.post("/:id/versions", protect, addVersion);
router.post("/:id/collaborators", protect, addCollaborator);
router.get("/", protect, filterWorkLogs);

module.exports = router;
