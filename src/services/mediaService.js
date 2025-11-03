const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  forcePathStyle: true,
  endpoint: process.env.OS_URI,
  region: "sgp1",
  credentials: {
    accessKeyId: process.env.OS_ACCESS_KEY,
    secretAccessKey: process.env.OS_SECRET_KEY
  }
});

// Helper: Generate clean filename
const generateFileName = (originalName, timestamp) => {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
  const extension = originalName.split('.').pop();
  
  const cleanName = nameWithoutExt
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  
  const timeString = timestamp.toString();
  
  return `${cleanName}_${timeString}.${extension}`;
};

// Helper: Get folder path based on current date
const getDateFolder = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return `${year}/${month}/${day}`;
};

// Upload base64 to DO Spaces
const uploadBase64ToSpaces = async (base64Data, originalName, fileType = 'image') => {
  const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
  if (!matches) return base64Data;

  const contentType = matches[1];
  const base64Content = matches[2];
  const buffer = Buffer.from(base64Content, 'base64');
  
  const timestamp = Date.now();
  const dateFolder = getDateFolder();
  const fileName = generateFileName(originalName || `${fileType}.${contentType.split('/')[1]}`, timestamp);
  const fullPath = `${dateFolder}/${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.OS_BUCKET,
    Key: fullPath,
    Body: buffer,
    ACL: 'public-read',
    ContentType: contentType
  });

  await s3Client.send(command);
  
  // ✅ FIXED: OS_URI already contains bucket name, just append the path
  // OS_URI format: https://nebwork-storage.sgp1.digitaloceanspaces.com
  // Full path includes bucket: nebwork-storage/2025/11/03/file.jpg
  const fullUrl = `${process.env.OS_URI}/${process.env.OS_BUCKET}/${fullPath}`;
  return fullUrl;
};

// Delete file from DO Spaces
const deleteFromSpaces = async (fileUrl) => {
  try {
    const urlParts = new URL(fileUrl);
    // Extract path after domain
    // URL: https://nebwork-storage.sgp1.digitaloceanspaces.com/nebwork-storage/2025/11/03/file.jpg
    // pathname: /nebwork-storage/2025/11/03/file.jpg
    // We need to remove the bucket name from the path since it's already specified in Bucket param
    let key = urlParts.pathname.substring(1); // Remove leading slash -> nebwork-storage/2025/11/03/file.jpg
    
    // Remove bucket name from the beginning of the path if it exists
    const bucket = process.env.OS_BUCKET;
    if (key.startsWith(`${bucket}/`)) {
      key = key.substring(bucket.length + 1); // Remove "nebwork-storage/" -> 2025/11/03/file.jpg
    }
    
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    throw error; // Re-throw to let controller handle it
  }
};

// ✅ UPDATED: Process content and media arrays - handle BOTH base64 AND URLs
const processMediaUploads = async (content, media) => {
  let processedContent = content;
  let processedMedia = [];

  // 1. Process inline images in TipTap content (base64 → URL)
  if (content) {
    const base64ImageRegex = /<img[^>]+src="(data:image\/[^"]+)"/g;
    const matches = [...content.matchAll(base64ImageRegex)];
    
    for (const match of matches) {
      const base64Src = match[1];
      try {
        const url = await uploadBase64ToSpaces(base64Src, 'inline_image', 'inline');
        processedContent = processedContent.replace(base64Src, url);
      } catch (error) {
        // Silent fail for inline images
      }
    }
  }

  // 2. Process media attachments
  if (media && Array.isArray(media)) {
    for (const item of media) {
      try {
        // Case A: Already has URL (uploaded via /api/upload endpoint)
        if (item.url && !item.url.startsWith('data:')) {
          processedMedia.push({
            url: item.url,
            type: item.type,
            name: item.name,
            size: item.size
          });
        }
        // Case B: Has base64 data (fallback/legacy support)
        else if (item.data && item.data.startsWith('data:')) {
          const url = await uploadBase64ToSpaces(item.data, item.name || 'attachment', 'attachment');
          processedMedia.push({
            url: url,
            type: item.type,
            name: item.name,
            size: item.size
          });
        }
        // Case C: Old format with url as base64 (backward compatibility)
        else if (item.url && item.url.startsWith('data:')) {
          const url = await uploadBase64ToSpaces(item.url, item.name || 'attachment', 'attachment');
          processedMedia.push({
            url: url,
            type: item.type,
            name: item.name,
            size: item.size
          });
        }
      } catch (error) {
        // Silent fail for individual media items
      }
    }
  }

  return { processedContent, processedMedia };
};

// Extract all media URLs from content and media array
const extractMediaUrls = (content, media) => {
  const urls = [];
  
  // Extract from inline images
  if (content) {
    const imgRegex = /<img[^>]+src="([^"]+)"/g;
    const matches = [...content.matchAll(imgRegex)];
    matches.forEach(match => {
      if (match[1] && !match[1].startsWith('data:')) {
        urls.push(match[1]);
      }
    });
  }
  
  // Extract from media attachments
  if (media && Array.isArray(media)) {
    media.forEach(item => {
      if (item.url && !item.url.startsWith('data:')) {
        urls.push(item.url);
      }
    });
  }
  
  return urls;
};

module.exports = {
  uploadBase64ToSpaces,
  deleteFromSpaces,
  processMediaUploads,
  extractMediaUrls
};