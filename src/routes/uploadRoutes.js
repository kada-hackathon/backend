const express = require('express');
const multer = require('multer');
const { uploadFile, uploadMultipleFiles, deleteFile, deleteMultipleFiles } = require('../controllers/uploadController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 100 * 1024 * 1024 // 100MB limit per file
  },
  fileFilter: (req, file, cb) => {
    // Accept images, videos, and documents
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not supported`), false);
    }
  }
});

/**
 * @route POST /api/upload
 * @desc Upload a single file to DigitalOcean Spaces
 * @access Private
 */
router.post('/', protect, upload.single('file'), (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large',
        error: `File size exceeds the maximum limit of 100MB. Your file is too big to upload.`,
        maxSize: '100MB'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Invalid field name',
        error: `Expected field name 'file', but got '${error.field}'. Please use 'file' as the form-data key.`
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Upload error',
      error: error.message
    });
  }
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'File validation failed',
      error: error.message
    });
  }
  next();
}, uploadFile);

/**
 * @route POST /api/upload/multiple
 * @desc Upload multiple files to DigitalOcean Spaces
 * @access Private
 */
router.post('/multiple', protect, upload.array('files', 10), (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large',
        error: `One or more files exceed the maximum limit of 100MB per file.`,
        maxSize: '100MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files',
        error: `Maximum 10 files allowed. You tried to upload more than the limit.`,
        maxFiles: 10
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Invalid field name',
        error: `Expected field name 'files', but got '${error.field}'. Please use 'files' as the form-data key.`
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Upload error',
      error: error.message
    });
  }
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'File validation failed',
      error: error.message
    });
  }
  next();
}, uploadMultipleFiles);

/**
 * @route DELETE /api/upload
 * @desc Delete a single file from DigitalOcean Spaces
 * @access Private
 */
router.delete('/', protect, deleteFile);

/**
 * @route DELETE /api/upload/multiple
 * @desc Delete multiple files from DigitalOcean Spaces
 * @access Private
 */
router.delete('/multiple', protect, deleteMultipleFiles);

module.exports = router;
