/**
 * @swagger
 * tags:
 *   name: Chatbot
 *   description: AI Chatbot API endpoints using RAG (Retrieval-Augmented Generation) with vector search
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatMessage:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB document ID
 *           example: "507f1f77bcf86cd799439011"
 *         user:
 *           type: string
 *           description: User ID who sent the message
 *           example: "507f191e810c19729de860ea"
 *         session_id:
 *           type: string
 *           description: Conversation session identifier
 *           example: "uuid-1699876543210"
 *         message:
 *           type: string
 *           description: User's question/message
 *           example: "What did John work on this week?"
 *         response:
 *           type: string
 *           description: AI-generated response based on worklog context
 *           example: "According to the work logs, John worked on..."
 *         context_used:
 *           type: number
 *           description: Number of worklog documents used for context
 *           example: 3
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Message creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Message update timestamp
 */

/**
 * @swagger
 * /api/chatbot:
 *   post:
 *     summary: Send message to AI chatbot and get intelligent response
 *     description: |
 *       **How it works:**
 *       1. Converts user message to vector embedding (semantic representation)
 *       2. Searches worklog database using vector similarity (finds relevant context)
 *       3. Sends context + question to AI model (RAG pattern)
 *       4. Returns AI-generated answer based on actual worklog data
 *       5. Automatically saves message exchange to database
 *       
 *       **Performance:** 
 *       - First request: ~6-9 seconds (embedding + search + AI)
 *       - Cached requests: ~4-7 seconds (embedding & search cached)
 *       
 *       **Context Limit:** Uses top 3 most relevant worklogs for optimal response quality
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
 *                 description: User's question or message to the chatbot
 *                 example: "What did John work on this week?"
 *                 minLength: 1
 *               session_id:
 *                 type: string
 *                 description: Optional session ID to continue existing conversation. If not provided, new UUID will be generated.
 *                 example: "uuid-1699876543210"
 *     responses:
 *       201:
 *         description: AI response generated and saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session_id:
 *                   type: string
 *                   description: Session identifier for this conversation
 *                   example: "uuid-1699876543210"
 *                 message:
 *                   type: string
 *                   description: Echo of user's original message
 *                   example: "What did John work on this week?"
 *                 response:
 *                   type: string
 *                   description: AI-generated response based on worklog context
 *                   example: "According to the work logs, John worked on backend API development, database optimization, and fixing critical bugs in the authentication module this week."
 *                 context_logs_count:
 *                   type: number
 *                   description: Number of worklog documents used as context
 *                   example: 3
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Response generation timestamp
 *                 processing_time:
 *                   type: string
 *                   description: Total processing time
 *                   example: "6234ms"
 *                 performance:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [fast, normal]
 *                       example: "normal"
 *                     message:
 *                       type: string
 *                       example: "✓ Response generated (large context processed)"
 *                 breakdown:
 *                   type: object
 *                   description: Detailed timing breakdown for performance monitoring
 *                   properties:
 *                     embedding:
 *                       type: string
 *                       example: "1856ms (29.7%)"
 *                     search:
 *                       type: string
 *                       example: "243ms (3.9%)"
 *                     ai:
 *                       type: string
 *                       example: "4135ms (66.3%)"
 *                     total:
 *                       type: string
 *                       example: "6234ms"
 *       400:
 *         description: Bad request - Invalid or empty message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Valid message is required"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Server error - Embedding, search, or AI generation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Something went wrong"
 *                 details:
 *                   type: string
 *                   description: Error details for debugging (remove in production)
 *                   example: "AI service timeout"
 */

/**
 * @swagger
 * /api/chatbot/session/{session_id}:
 *   get:
 *     summary: Get all messages in a specific chat session
 *     description: |
 *       Retrieves conversation history for a given session ID. Returns all message exchanges 
 *       (user questions + bot responses) in chronological order.
 *       
 *       **Use cases:**
 *       - Display chat history when user returns to conversation
 *       - Export conversation for records
 *       - Debug chatbot responses
 *       - Analyze conversation patterns
 *       
 *       **Security:** Users can only access their own chat sessions
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session identifier to retrieve messages for
 *         example: "uuid-1699876543210"
 *     responses:
 *       200:
 *         description: Chat session messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session_id:
 *                   type: string
 *                   description: Session identifier
 *                   example: "uuid-1699876543210"
 *                 messages:
 *                   type: array
 *                   description: Array of message exchanges in chronological order
 *                   items:
 *                     $ref: '#/components/schemas/ChatMessage'
 *                 count:
 *                   type: number
 *                   description: Total number of message exchanges in this session
 *                   example: 5
 *       400:
 *         description: Bad request - Session ID not provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Session ID is required"
 *       404:
 *         description: Chat session not found or no messages in this session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No chat history"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Server error - Database query failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
                 error:
                   type: string
                   example: "An error occurred"
 */

/**
 * @swagger
 * /api/chatbot/history:
 *   get:
 *     summary: Get list of all chat sessions with metadata (paginated)
 *     description: |
 *       Returns paginated list of chat sessions for the authenticated user with metadata:
 *       - Title (from first message)
 *       - Last message preview
 *       - Message count
 *       - Timestamps (created & updated)
 *       
 *       Uses MongoDB aggregation for optimal performance.
 *       Supports pagination with query parameters.
 *       
 *       **Use cases:** 
 *       - Display chat history sidebar
 *       - Load more older conversations
 *       - Infinite scroll implementation
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number (starts from 1)
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of sessions per page (max 50)
 *         example: 10
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
 *                         description: Unique session identifier
 *                         example: "session-1699876543210"
 *                       title:
 *                         type: string
 *                         description: Chat title (truncated first message)
 *                         example: "What did John work on this week?..."
 *                       last_message:
 *                         type: string
 *                         description: Preview of last bot response
 *                         example: "According to the work logs, John worked on..."
 *                       message_count:
 *                         type: number
 *                         description: Total number of message exchanges
 *                         example: 5
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: Session creation timestamp
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         description: Last activity timestamp
 *                 pagination:
 *                   type: object
 *                   description: Pagination metadata
 *                   properties:
 *                     current_page:
 *                       type: number
 *                       description: Current page number
 *                       example: 1
 *                     total_pages:
 *                       type: number
 *                       description: Total number of pages
 *                       example: 5
 *                     total_sessions:
 *                       type: number
 *                       description: Total number of sessions across all pages
 *                       example: 45
 *                     sessions_per_page:
 *                       type: number
 *                       description: Number of sessions per page
 *                       example: 10
 *                     has_next:
 *                       type: boolean
 *                       description: Whether there are more pages after this one
 *                       example: true
 *                     has_prev:
 *                       type: boolean
 *                       description: Whether there are pages before this one
 *                       example: false
 *             examples:
 *               first_page:
 *                 summary: First page with results
 *                 value:
 *                   chats:
 *                     - session_id: "session-1699876543210"
 *                       title: "What did John work on this week?..."
 *                       last_message: "According to the work logs, John worked on..."
 *                       message_count: 5
 *                       created_at: "2024-01-15T10:00:00Z"
 *                       updated_at: "2024-01-15T12:30:00Z"
 *                   pagination:
 *                     current_page: 1
 *                     total_pages: 5
 *                     total_sessions: 45
 *                     sessions_per_page: 10
 *                     has_next: true
 *                     has_prev: false
 *               last_page:
 *                 summary: Last page with remaining results
 *                 value:
 *                   chats:
 *                     - session_id: "session-1699876543215"
 *                       title: "How to deploy this app?..."
 *                       last_message: "To deploy the application, follow these steps..."
 *                       message_count: 3
 *                       created_at: "2024-01-10T08:00:00Z"
 *                       updated_at: "2024-01-10T09:15:00Z"
 *                   pagination:
 *                     current_page: 5
 *                     total_pages: 5
 *                     total_sessions: 45
 *                     sessions_per_page: 10
 *                     has_next: false
 *                     has_prev: true
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Server error - Aggregation query failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch chat history"
 *                 details:
 *                   type: string
 *                   example: "MongoDB aggregation error"
 */

/**
 * @swagger
 * /api/chatbot/session/{session_id}:
 *   delete:
 *     summary: Delete a chat session and all its messages
 *     description: |
 *       Permanently deletes all message exchanges in the specified session.
 *       
 *       **Security:** Users can only delete their own sessions.
 *       
 *       **Use cases:**
 *       - User wants to clean up chat history
 *       - Remove sensitive conversations
 *       - Free up database space
 *       
 *       **Warning:** This action cannot be undone!
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session identifier to delete
 *         example: "session-1699876543210"
 *     responses:
 *       200:
 *         description: Chat session deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Chat session deleted successfully"
 *                 session_id:
 *                   type: string
 *                   description: ID of deleted session
 *                   example: "session-1699876543210"
 *                 deleted_count:
 *                   type: number
 *                   description: Number of message documents deleted
 *                   example: 10
 *       400:
 *         description: Bad request - Session ID not provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Session ID is required"
 *       404:
 *         description: Chat session not found or already deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Chat session not found or already deleted"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Server error - Delete operation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to delete chat session"
 *                 details:
 *                   type: string
 *                   example: "Database connection error"
 */
