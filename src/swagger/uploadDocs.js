/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: File upload and deletion endpoints (Images, Videos, Documents)
 */

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a single file to cloud storage
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (Max 100MB)
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "File uploaded successfully"
 *                 file:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: "https://your-space.sgp1.digitaloceanspaces.com/uploads/filename.jpg"
 *                     key:
 *                       type: string
 *                       example: "uploads/1699876543210-filename.jpg"
 *                     size:
 *                       type: integer
 *                       example: 2048576
 *                     mimetype:
 *                       type: string
 *                       example: "image/jpeg"
 *       400:
 *         description: Invalid file or validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "File validation failed"
 *                 error:
 *                   type: string
 *                   example: "File type image/bmp is not supported"
 *       413:
 *         description: File too large
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "File too large"
 *                 error:
 *                   type: string
 *                   example: "File size exceeds the maximum limit of 100MB"
 *                 maxSize:
 *                   type: string
 *                   example: "100MB"
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/upload/multiple:
 *   post:
 *     summary: Upload multiple files (max 10 files)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Multiple files to upload (Max 10 files, 100MB each)
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "3 files uploaded successfully"
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       key:
 *                         type: string
 *                       size:
 *                         type: integer
 *                       mimetype:
 *                         type: string
 *       400:
 *         description: Too many files or invalid files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Too many files"
 *                 error:
 *                   type: string
 *                   example: "Maximum 10 files allowed"
 *                 maxFiles:
 *                   type: integer
 *                   example: 10
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/upload:
 *   delete:
 *     summary: Delete a single file from cloud storage
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *             properties:
 *               key:
 *                 type: string
 *                 description: File key/path to delete
 *                 example: "uploads/1699876543210-filename.jpg"
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "File deleted successfully"
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/upload/multiple:
 *   delete:
 *     summary: Delete multiple files from cloud storage
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - keys
 *             properties:
 *               keys:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of file keys/paths to delete
 *                 example: ["uploads/file1.jpg", "uploads/file2.png"]
 *     responses:
 *       200:
 *         description: Files deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "2 files deleted successfully"
 *                 deleted:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FileUploadResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         file:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               description: Public URL of uploaded file
 *             key:
 *               type: string
 *               description: Storage key/path
 *             size:
 *               type: integer
 *               description: File size in bytes
 *             mimetype:
 *               type: string
 *               description: MIME type of the file
 */
