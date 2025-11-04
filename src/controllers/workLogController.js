const WorkLog = require("../models/WorkLog");
const LogHistory = require("../models/LogHistory");
const User = require("../models/User");
const { generateEmbedding, prepareTextForEmbedding } = require("../services/embeddingService");
const { processMediaUploads, extractMediaUrls, deleteFromSpaces } = require("../services/mediaService");

exports.addWorkLog = async (req, res) => {
  try {
    const { title, content, tag, media } = req.body;

    // 🔥 Process uploads:
    // - Inline images in content (base64 → URL)
    // - Media attachments that are still base64 (fallback for legacy/special cases)
    // - Media with URLs (already uploaded) → keep as-is
    const { processedContent, processedMedia } = await processMediaUploads(content, media);

    const textToEmbed = prepareTextForEmbedding({ title, content: processedContent, tag });
    const embedding = await generateEmbedding(textToEmbed);

    const log = await WorkLog.create({
      title, 
      content: processedContent, 
      tag, 
      media: processedMedia, 
      user: req.user._id, 
      embedding
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

    // 🔥 Process any new base64 uploads in edited content
    const { processedContent, processedMedia } = await processMediaUploads(
      req.body.content || log.content,
      req.body.media || log.media
    );

    // Regenerate embedding with updated content
    const textToEmbed = prepareTextForEmbedding({
      title: req.body.title || log.title,
      content: processedContent,
      tag: req.body.tag || log.tag
    });
    const embedding = await generateEmbedding(textToEmbed);

    const updated = await WorkLog.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body, 
        content: processedContent,
        media: processedMedia,
        embedding 
      },
      { new: true }
    );
    
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

    if (worklog.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not allowed to delete this worklog" });
    }

    // 🔥 Delete all associated media from DO Spaces
    const mediaUrls = extractMediaUrls(worklog.content, worklog.media);
    await Promise.all(mediaUrls.map(url => deleteFromSpaces(url)));

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
    res.status(201).json({
      message: "Version added",
      version,
    });
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

    // Check if user is the owner
    if (log.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the owner can add collaborators" });
    }

    // Add to collaborators array if not already there
    if (!log.collaborators.includes(collaborator._id)) {
      log.collaborators.push(collaborator._id);
      await log.save();
    }

    res.json({ 
      message: "Collaborator added with edit access", 
      log 
    });
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


// Search & Filter worklogs dengan query parameters (Division-aware + Pagination)
exports.filterWorkLogs = async (req, res) => {
  try {
    const { search, tag, from, to, page = 1, limit = 10 } = req.query;
    
    // Get user division from JWT token (already authenticated via protect middleware)
    const userDivision = req.user?.division;
    
    if (!userDivision) {
      console.warn('⚠️ filterWorkLogs - No user division found!');
    }

    // Build base filter untuk DB query
    let filter = {};

    // Search by title, content
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by tags (dapat comma-separated atau array)
    if (tag) {
      const tags = Array.isArray(tag) ? tag : tag.split(",").map(t => t.trim().replace(/^#+/, '').toLowerCase());
      filter.$or = [
        { tag: { $in: tags } }, // Exact match (case insensitive)
        { tag: { $in: tags.map(t => new RegExp(t, 'i')) } } // Partial match (case insensitive)
      ];
    }
    
   

    // Filter by date range
    if (from && to) {
      filter.datetime = { $gte: new Date(from), $lte: new Date(to) };
    } else if (from) {
      filter.datetime = { $gte: new Date(from) };
    } else if (to) {
      filter.datetime = { $lte: new Date(to) };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Query database with all filters
    let logs = await WorkLog.find(filter)
      .populate({
        path: "user",
        match: { division: userDivision }, // Filter by division during population
        select: "name email division profile_photo"
      })
      .populate("collaborators", "name email division")
      .sort({ datetime: -1 });

    // Remove entries where user population returned null (different division)
    logs = logs.filter(log => log.user !== null);

    // Get total count for pagination
    const totalDocs = logs.length;

    // Apply pagination after division filter
    const startIndex = skip;
    const endIndex = startIndex + parseInt(limit);
    logs = logs.slice(startIndex, endIndex);

    // Calculate pagination info
    const totalPages = Math.ceil(totalDocs / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({ 
      worklogs: logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalDocs,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET detail worklog by ID
exports.getWorkLogById = async (req, res) => {
  try {
    const worklog = await WorkLog.findById(req.params.id)
      .populate("user", "name email division profile_photo join_date")
      .populate("collaborators", "name email division");
    
    if (!worklog) {
      return res.status(404).json({ message: "WorkLog not found" });
    }
    
    res.json(worklog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET active collaboration status (who's editing right now)
exports.getCollaborationStatus = async (req, res) => {
  try {
    const worklog = await WorkLog.findById(req.params.id)
      .select('activeUsers title user collaborators')
      .populate('activeUsers.userId', 'name email profile_photo');
    
    if (!worklog) {
      return res.status(404).json({ message: "WorkLog not found" });
    }

    // Check if user has access to view this
    const isOwner = worklog.user?.toString() === req.user._id.toString();
    const isCollaborator = worklog.collaborators?.some(
      id => id.toString() === req.user._id.toString()
    );
    
    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({
      worklogId: worklog._id,
      title: worklog.title,
      activeUsers: worklog.activeUsers || [],
      totalActive: worklog.activeUsers?.length || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
