/**
 * @swagger
 * tags:
 *   name: Chatbot
 *   description: AI Chatbot API endpoints for chat sessions and history
 */

/**
 * @swagger
 * /api/chatbot:
 *   post:
 *     summary: Send a message to chatbot and get AI response
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: User message to send to chatbot
 *                 example: "How do I create a new worklog?"
 *               session_id:
 *                 type: string
 *                 description: Optional session ID to continue existing conversation
 *                 example: "1699876543210"
 *     responses:
 *       200:
 *         description: AI response received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 *                   description: AI-generated response
 *                   example: "To create a new worklog, click the 'New Worklog' button..."
 *                 session_id:
 *                   type: string
 *                   description: Session ID for this conversation
 *                   example: "1699876543210"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/chatbot/save:
 *   post:
 *     summary: Save chat session to database
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - session_id
 *               - title
 *               - messages
 *             properties:
 *               session_id:
 *                 type: string
 *                 description: Unique session identifier
 *                 example: "1699876543210"
 *               title:
 *                 type: string
 *                 description: Title/summary of the chat
 *                 example: "How to create worklog"
 *               messages:
 *                 type: array
 *                 description: Array of chat messages
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "1699876543211"
 *                     text:
 *                       type: string
 *                       example: "How do I create a new worklog?"
 *                     sender:
 *                       type: string
 *                       enum: [user, bot]
 *                       example: "user"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-04T10:30:00.000Z"
 *     responses:
 *       200:
 *         description: Chat saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Chat saved successfully"
 *                 chat:
 *                   type: object
 *                   properties:
 *                     session_id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     messages:
 *                       type: array
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/chatbot/history:
 *   get:
 *     summary: Get user's chat history
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       session_id:
 *                         type: string
 *                         example: "1699876543210"
 *                       title:
 *                         type: string
 *                         example: "How to create worklog"
 *                       messages:
 *                         type: array
 *                         items:
 *                           type: object
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/chatbot/session/{sessionId}:
 *   get:
 *     summary: Get specific chat session by ID
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID to retrieve
 *         example: "1699876543210"
 *     responses:
 *       200:
 *         description: Chat session retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chat:
 *                   type: object
 *                   properties:
 *                     session_id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     messages:
 *                       type: array
 *       404:
 *         description: Chat not found
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete a chat session
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID to delete
 *     responses:
 *       200:
 *         description: Chat deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Chat deleted successfully"
 *       404:
 *         description: Chat not found
 *       401:
 *         description: Unauthorized
 */
