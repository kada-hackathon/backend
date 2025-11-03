const { uploadBase64ToSpaces, deleteFromSpaces } = require('../services/mediaService');

/**
 * Upload a single file to DigitalOcean Spaces
 * @route POST /api/upload
 * @access Private
 */
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file provided' 
      });
    }

    // Convert buffer to base64 format
    const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    // Upload to DigitalOcean Spaces
    const url = await uploadBase64ToSpaces(base64Data, req.file.originalname, 'upload');

    // Return the uploaded file details
    res.status(200).json({
      success: true,
      url,
      type: req.file.mimetype.split('/')[0],
      name: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to upload file',
      error: error.message 
    });
  }
};

/**
 * Upload multiple files to DigitalOcean Spaces
 * @route POST /api/upload/multiple
 * @access Private
 */
exports.uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No files provided' 
      });
    }

    // Upload all files in parallel
    const uploadPromises = req.files.map(async (file) => {
      const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const url = await uploadBase64ToSpaces(base64Data, file.originalname, 'upload');
      
      return {
        url,
        type: file.mimetype.split('/')[0],
        name: file.originalname,
        size: file.size
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to upload files',
      error: error.message 
    });
  }
};

/**
 * Delete an uploaded file from DigitalOcean Spaces
 * @route DELETE /api/upload
 * @access Private
 */
exports.deleteFile = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ 
        success: false,
        message: 'No URL provided' 
      });
    }

    // 🔥 FIXED: Check if URL is from your DigitalOcean Spaces
    // Expected format: https://nebwork-storage.sgp1.digitaloceanspaces.com/nebwork-storage/path/to/file.ext
    const osUri = process.env.OS_URI || '';
    const bucket = process.env.OS_BUCKET || '';
    
    // Valid URL should start with OS_URI
    if (!url.startsWith(osUri)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid file URL - must be from your storage',
        providedUrl: url,
        expectedPrefix: osUri,
        hint: `URL must start with ${osUri}`
      });
    }

    // Delete from Spaces
    await deleteFromSpaces(url);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      url
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete file',
      error: error.message 
    });
  }
};

/**
 * Delete multiple uploaded files from DigitalOcean Spaces
 * @route DELETE /api/upload/multiple
 * @access Private
 */
exports.deleteMultipleFiles = async (req, res) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No URLs provided. Expected an array of URLs.' 
      });
    }

    // 🔥 FIXED: Same validation as single delete
    const osUri = process.env.OS_URI || '';
    
    // Validate all URLs start with OS_URI
    const invalidUrls = urls.filter(url => !url.startsWith(osUri));

    if (invalidUrls.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Some URLs are not from your storage',
        invalidUrls,
        expectedPrefix: osUri,
        hint: `All URLs must start with ${osUri}`
      });
    }

    // Delete all files in parallel
    const deletePromises = urls.map(url => deleteFromSpaces(url));
    await Promise.all(deletePromises);

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${urls.length} file(s)`,
      deletedUrls: urls,
      count: urls.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete files',
      error: error.message 
    });
  }
};