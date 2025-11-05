const Chat = require('../models/Chat');
const { generateEmbedding } = require('../services/embeddingService');
const chatbotService = require('../services/chatbotService');
const aiService = require('../services/aiService');
const cacheService = require('../services/cacheService');
const { v4: uuidv4 } = require('uuid');

/**
 * ====================================================================
 * CHATBOT CONTROLLER
 * ====================================================================
 * 
 * Purpose: HTTP request handlers for chatbot functionality
 * 
 * Architecture: MVC Pattern (Model-View-Controller)
 * - Controller: This file (handles HTTP requests/responses)
 * - Services: Business logic (chatbotService, aiService, cacheService)
 * - Models: Database schemas (Chat, WorkLog)
 * 
 * Endpoints:
 * - POST /api/chatbot/message - Send message to chatbot
 * - GET /api/chatbot/messages/:session_id - Get chat history
 * 
 * Key Design Patterns:
 * 1. Service Layer Pattern: Business logic in separate services
 * 2. Repository Pattern: Database access through models
 * 3. Caching Layer: Performance optimization with cache service
 * 
 * Performance Strategy:
 * - Cache expensive operations (embeddings, searches)
 * - Background DB saves (don't block response)
 * - Detailed timing logs (identify bottlenecks)
 * 
 * Error Handling:
 * - Validation at entry point
 * - Try-catch for all async operations
 * - Meaningful error messages for debugging
 * - Don't expose internal errors to users
 * 
 * @author Principal Engineer
 * @date October 2025
 * ====================================================================
 */

/**
 * ================================================================
 * POST MESSAGE TO CHATBOT
 * ================================================================
 * 
 * Endpoint: POST /api/chatbot/message
 * 
 * Purpose: Main chatbot interaction - answer user questions
 * 
 * Request Flow (3-Phase Pipeline):
 * 
 * Phase 1: EMBEDDING (1500-2000ms first time, 5ms cached)
 * └─ Convert user question to vector embedding
 * └─ Why? Enable semantic search (find similar meaning, not just keywords)
 * └─ Cached? Yes, 1 hour TTL
 * 
 * Phase 2: SEARCH (200-300ms first time, 10ms cached)
 * └─ Vector search MongoDB for relevant WorkLogs
 * └─ Why? RAG pattern - give AI our data as context
 * └─ Cached? Yes, 5 minute TTL
 * 
 * Phase 3: AI GENERATION (4000-7000ms, never cached)
 * └─ Send context + question to AI
 * └─ Why? Generate comprehensive, accurate answer
 * └─ Cached? No, each answer should be unique
 * 
 * Total Time:
 * - First request: 6000-9000ms (all MISS)
 * - Cached request: 4000-7000ms (embedding + search HIT)
 * 
 * Request Body:
 * {
 *   "message": "What did John work on?",
 *   "session_id": "optional-uuid-for-conversation"
 * }
 * 
 * Response:
 * {
 *   "session_id": "uuid",
 *   "message": "What did John work on?",
 *   "response": "According to the work logs...",
 *   "context_logs_count": 3,
 *   "processing_time": "6234ms",
 *   "breakdown": { ... }
 * }
 * 
 * Error Scenarios:
 * - 400: Invalid/empty message
 * - 404: No WorkLogs found (handled gracefully)
 * - 500: Service failure (embedding, search, or AI)
 * - 502: AI API unavailable
 * 
 * Production Monitoring:
 * - Track processing_time trend
 * - Alert if > 10 seconds
 * - Monitor cache hit rates
 * - Watch for error spikes
 * 
 * @route POST /api/chatbot/message
 * @access Private (requires authentication)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * ================================================================
 */
exports.postMessageChatbot = async (req, res) => {
    try {
        const { message, session_id } = req.body;

        // ============================================================
        // INPUT VALIDATION
        // ============================================================
        // Always validate at the entry point (controller layer)
        // Why? Fail fast, prevent wasted processing, clear error messages
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ error: "Valid message is required" });
        }

        // ============================================================
        // SESSION MANAGEMENT
        // ============================================================
        // Generate new UUID if not provided
        // Why? Track conversation history, enable context-aware responses
        // Future: Use session to maintain conversation context
        const actualSessionId = session_id || uuidv4();
        const startTime = Date.now(); // Track total processing time

        // ============================================================
        // PHASE 1: GENERATE QUERY EMBEDDING
        // ============================================================
        // Purpose: Convert text question to vector for semantic search
        // 
        // What happens:
        // 1. Check cache (hash of message text)
        // 2. If MISS: Call Korean embedding API (1500-2000ms)
        // 3. If HIT: Return cached embedding (5ms)
        // 4. Save to cache for future requests
        // 
        // Why cache embeddings?
        // - Same question = same embedding (deterministic)
        // - Expensive API call (1500-2000ms, costs money)
        // - High hit rate for common questions
        const embeddingStart = Date.now();
        const queryEmbedding = await cacheService.getEmbedding(message, generateEmbedding);
        const embeddingTime = Date.now() - embeddingStart;

        // ============================================================
        // PHASE 2: VECTOR SEARCH WORKLOGS
        // ============================================================
        // Purpose: Find relevant WorkLogs using semantic similarity
        // 
        // What happens:
        // 1. Create cache key from embedding (first 20 dimensions)
        // 2. If MISS: Query MongoDB vector search (200-300ms)
        // 3. If HIT: Return cached results (10ms)
        // 4. Save to cache for similar queries
        // 
        // Why cache search results?
        // - Similar questions have similar embeddings
        // - Vector search is expensive (scans thousands of embeddings)
        // - Results don't change frequently (5 min TTL is safe)
        // 
        // Limit = 3: Why so few?
        // - Balance: More context = better answers BUT slower AI
        // - 3 logs = ~1800 chars = ~450 tokens
        // - Enough for comprehensive answers without excessive delay
        const searchStart = Date.now();
        
        const relevantLogs = await cacheService.getSearchResults(
            queryEmbedding,
            () => chatbotService.searchWorkLogs(queryEmbedding, 3)
        );

        const searchTime = Date.now() - searchStart;

        // Log results for debugging and monitoring
        chatbotService.logSearchResults(relevantLogs);

        // ============================================================
        // BUILD CONTEXT FOR AI
        // ============================================================
        // Purpose: Format WorkLogs into text the AI can understand
        // 
        // Returns null if no logs found
        // This triggers special "no data" response
        const context = chatbotService.buildContext(relevantLogs);

        // Handle edge case: No WorkLogs in database
        if (!context) {
            return await this.handleNoContext(req.user._id, actualSessionId, message, res);
        }

        // ============================================================
        // PHASE 3: GENERATE AI RESPONSE
        // ============================================================
        // Purpose: Get AI answer based on WorkLog context
        // 
        // What happens:
        // 1. Create system prompt (instructions + context)
        // 2. Send to DigitalOcean AI API
        // 3. Wait for response (4000-7000ms)
        // 4. Parse and validate answer
        // 
        // Why NOT cache AI responses?
        // - Each answer should be unique (conversational)
        // - Users expect different wording
        // - Caching would make bot feel robotic
        // 
        // Performance breakdown:
        // - Network latency: 200-400ms (Asia → USA)
        // - Input processing: ~1ms per token × 450 = 450ms
        // - Output generation: ~10ms per token × 450 = 4500ms
        // - Total: 5150-5350ms (matches observed ~5000ms)

        const systemPrompt = chatbotService.generateSystemPrompt(context);
        const aiStart = Date.now();
        const aiAnswer = await aiService.generateResponse(systemPrompt, message);
        const aiTime = Date.now() - aiStart;

        // ============================================================
        // CALCULATE PERFORMANCE METRICS
        // ============================================================
        // Why track this?
        // - Identify bottlenecks (which phase is slow?)
        // - Monitor trends over time
        // - Justify optimization efforts with data
        // - SLA compliance (are we meeting performance targets?)
        const totalTime = Date.now() - startTime;

        // ============================================================
        // SEND RESPONSE TO USER
        // ============================================================
        // Design decision: Send response BEFORE saving to database
        // Why? 
        // - User sees response faster (perceived performance)
        // - DB save is not critical path
        // - If DB save fails, user still got their answer
        // 
        // Response structure:
        // - session_id: For conversation tracking
        // - message: Echo user's question
        // - response: AI's answer
        // - context_logs_count: How many logs were used
        // - processing_time: Total time for transparency
        // - performance: User-friendly status message
        // - breakdown: Detailed timing for debugging
        res.status(201).json({
            session_id: actualSessionId,
            message: message,
            response: aiAnswer,
            context_logs_count: relevantLogs.length,
            timestamp: new Date(),
            processing_time: `${totalTime}ms`,
            performance: {
                status: totalTime < 6000 ? "fast" : "normal",
                message: totalTime < 6000
                    ? "✓ Response generated quickly"
                    : "✓ Response generated (large context processed)"
            },
            breakdown: {
                embedding: `${embeddingTime}ms (${embeddingPercent}%)`,
                search: `${searchTime}ms (${searchPercent}%)`,
                ai: `${aiTime}ms (${aiPercent}%)`,
                total: `${totalTime}ms`
            }
        });

        // ============================================================
        // SAVE TO DATABASE (BACKGROUND)
        // ============================================================
        // Why background save?
        // - Response already sent to user
        // - Don't block on DB write
        // - If it fails, log error but don't crash
        // 
        // What we store:
        // - Full conversation history
        // - Metadata for analytics
        // - Context used for quality analysis
        // 
        // Future enhancements:
        // - Add user feedback (thumbs up/down)
        // - Track which logs led to best answers
        // - A/B test different prompt strategies
        Chat.create({
            user: req.user._id,
            session_id: actualSessionId,
            message: message,
            response: aiAnswer,
            context_used: relevantLogs.length
        }).catch(err => {
            // Silent fail for background save
        });

    } catch (error) {
        // ============================================================
        // ERROR HANDLING
        // ============================================================
        // Design pattern: Centralized error handling
        // 
        // What we log:
        // - Error message for debugging
        // - Stack trace for finding root cause
        // 
        // What we send to user:
        // - Generic message (don't expose internals)
        // - Error details (for debugging, remove in production)
        // 
        // Production considerations:
        // - Log to monitoring service (Sentry, DataDog)
        // - Alert on high error rates
        // - Categorize errors (user error vs system error)
        return res.status(500).json({
            error: "Something went wrong",
            details: error.message // TODO: Remove in production
        });
    }
};

/**
 * ================================================================
 * GET CHAT HISTORY
 * ================================================================
 * 
 * Endpoint: GET /api/chatbot/messages/:session_id
 * 
 * Purpose: Retrieve conversation history for a session
 * 
 * Use Cases:
 * - Display chat history when user returns
 * - Export conversation for records
 * - Debug chatbot responses
 * - Analyze conversation patterns
 * 
 * Query Strategy:
 * - Filter by user_id (security: users only see their chats)
 * - Filter by session_id (get specific conversation)
 * - Sort by createdAt ascending (chronological order)
 * 
 * Response Structure:
 * {
 *   "session_id": "uuid",
 *   "messages": [
 *     {
 *       "message": "What is AI?",
 *       "response": "According to the logs...",
 *       "createdAt": "2025-10-31T10:30:00Z",
 *       "context_used": 3
 *     }
 *   ],
 *   "count": 5
 * }
 * 
 * Performance Considerations:
 * - Add index on (user, session_id) for fast queries
 * - Limit result size (pagination for long conversations)
 * - Consider caching recent conversations
 * 
 * Future Enhancements:
 * - Pagination (skip, limit)
 * - Date range filtering
 * - Search within conversation
 * - Export as PDF/JSON
 * 
 * @route GET /api/chatbot/messages/:session_id
 * @access Private (requires authentication)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * ================================================================
 */
exports.getMessagesChatbot = async (req, res) => {
    try {
        // Extract session_id from URL parameter
        // Example: /api/chatbot/messages/abc-123-def-456
        const { session_id } = req.params;

        // Validation: Ensure session_id is provided
        // Prevents expensive database queries with undefined filter
        if (!session_id) {
            return res.status(400).json({ error: "Session ID is required" });
        }

        // Query database for all messages in this session
        // Security: Only return messages belonging to authenticated user (req.user._id)
        // Sort: Chronological order (oldest first) for natural conversation flow
        const messages = await Chat.find({
            user: req.user._id,
            session_id: session_id
        }).sort({ createdAt: 1 }); // 1 = ascending (oldest → newest)

        // Handle empty result: No chat history found
        // This is NOT an error - user may have deleted history or session is new
        if (messages.length === 0) {
            return res.status(404).json({ error: "No chat history" });
        }

        // Success response with structured data
        // Include message count for UI display (e.g., "5 messages in this conversation")
        res.json({
            session_id: session_id,
            messages: messages,
            count: messages.length
        });

    } catch (error) {
        // Return generic error to client
        // Don't expose database details for security
        return res.status(500).json({ error: "An error occurred" });
    }
};

/**
 * ================================================================
 * HANDLE NO CONTEXT SCENARIO
 * ================================================================
 * 
 * Purpose: Gracefully handle when there are NO work logs to search
 * 
 * When Called:
 * - User asks question, but WorkLog collection is empty
 * - Or all work logs have no embeddings yet
 * 
 * Design Decision: Don't call AI when there's no context
 * Why?
 * - AI would hallucinate or give generic answer
 * - Wastes API credits (~$0.001 per call)
 * - Better UX to be honest: "I don't have data"
 * 
 * Response Strategy:
 * - Friendly message explaining the situation
 * - Still save to Chat collection (for analytics)
 * - Return 200 status (not 404 - this is expected behavior)
 * 
 * Alternative Approaches:
 * 1. Call AI anyway with generic prompt (expensive, hallucination risk)
 * 2. Return error 400 (bad UX, not user's fault)
 * 3. Queue question and answer later (complex, not MVP)
 * 
 * Future Enhancements:
 * - Suggest user to add work logs
 * - Show onboarding tutorial
 * - Email admin if database is empty
 * 
 * @param {String} userId - MongoDB user ID
 * @param {String} sessionId - UUID session identifier
 * @param {String} message - User's question
 * @param {Response} res - Express response object
 * ================================================================
 */
exports.handleNoContext = async (userId, sessionId, message, res) => {
    // Friendly response explaining the situation
    // Don't blame user, explain system state
    const noContextResponse = "I don't have any work logs to answer your question. The system doesn't have any work logs yet.";

    // Save to database even though we didn't call AI
    // Why?
    // - Track user intent (what they wanted to ask)
    // - Analytics: How many users hit this edge case?
    // - Conversation continuity (show in chat history)
    const requestChat = await Chat.create({
        user: userId,
        session_id: sessionId,
        message: message,
        response: noContextResponse,
        context_used: 0 // No work logs were used (database is empty)
    });

    // Return 201 (Created) since we successfully saved the chat
    // Note: Could use 200 (OK) instead, but 201 indicates resource created
    // 
    // Response structure matches normal chatbot response
    // This consistency makes frontend code simpler (same interface)
    return res.status(201).json({
        session_id: requestChat.session_id,
        message: requestChat.message,
        response: requestChat.response,
        context_logs_count: 0, // No logs available
        timestamp: requestChat.createdAt
    });
};

/**
 * ================================================================
 * GET CHAT HISTORY (ALL SESSIONS) WITH PAGINATION
 * ================================================================
 * 
 * Endpoint: GET /api/chatbot/history?page=1&limit=10
 * 
 * Purpose: Get list of all chat sessions for user with metadata
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Sessions per page (default: 10, max: 50)
 * 
 * Uses MongoDB aggregation to:
 * - Group messages by session_id
 * - Extract title (first message)
 * - Get last message (last response)
 * - Calculate message count
 * - Sort by most recent first
 * - Paginate results
 * 
 * @route GET /api/chatbot/history
 * @access Private (requires authentication)
 * ================================================================
 */
exports.getChatHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Parse pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 per page
        const skip = (page - 1) * limit;

        // Get total count of sessions first
        const totalSessions = await Chat.distinct('session_id', { user: userId });
        const totalCount = totalSessions.length;
        const totalPages = Math.ceil(totalCount / limit);

        // MongoDB aggregation pipeline with pagination
        const sessions = await Chat.aggregate([
            // Stage 1: Filter by user
            { $match: { user: userId } },
            
            // Stage 2: Sort by creation time (oldest first for grouping)
            { $sort: { createdAt: 1 } },
            
            // Stage 3: Group by session_id and collect metadata
            { 
                $group: {
                    _id: "$session_id",
                    first_message: { $first: "$message" },
                    last_response: { $last: "$response" },
                    first_created: { $first: "$createdAt" },
                    last_updated: { $last: "$createdAt" },
                    message_count: { $sum: 1 }
                }
            },
            
            // Stage 4: Sort by most recent first
            { $sort: { last_updated: -1 } },
            
            // Stage 5: Pagination - Skip
            { $skip: skip },
            
            // Stage 6: Pagination - Limit
            { $limit: limit }
        ]);

        // Format response for frontend
        const history = sessions.map(session => ({
            session_id: session._id,
            title: session.first_message.substring(0, 50) + (session.first_message.length > 50 ? '...' : ''),
            last_message: session.last_response.substring(0, 100) + (session.last_response.length > 100 ? '...' : ''),
            message_count: session.message_count,
            created_at: session.first_created,
            updated_at: session.last_updated
        }));

        res.json({ 
            chats: history,
            pagination: {
                current_page: page,
                total_pages: totalPages,
                total_sessions: totalCount,
                sessions_per_page: limit,
                has_next: page < totalPages,
                has_prev: page > 1
            }
        });

    } catch (error) {
        console.error('Error fetching chat history:', error);
        return res.status(500).json({ 
            error: "Failed to fetch chat history",
            details: error.message 
        });
    }
};

/**
 * ================================================================
 * DELETE CHAT SESSION
 * ================================================================
 * 
 * Endpoint: DELETE /api/chatbot/session/:session_id
 * 
 * Purpose: Delete all messages in a specific chat session
 * 
 * Security: Users can only delete their own sessions
 * 
 * @route DELETE /api/chatbot/session/:session_id
 * @access Private (requires authentication)
 * ================================================================
 */
exports.deleteChatSession = async (req, res) => {
    try {
        const { session_id } = req.params;
        const userId = req.user._id;

        // Validate session_id
        if (!session_id) {
            return res.status(400).json({ error: "Session ID is required" });
        }

        // Delete all messages in this session for this user
        const result = await Chat.deleteMany({
            user: userId,
            session_id: session_id
        });

        // Check if any documents were deleted
        if (result.deletedCount === 0) {
            return res.status(404).json({ 
                error: "Chat session not found or already deleted" 
            });
        }

        res.json({
            message: "Chat session deleted successfully",
            session_id: session_id,
            deleted_count: result.deletedCount
        });

    } catch (error) {
        console.error('Error deleting chat session:', error);
        return res.status(500).json({ 
            error: "Failed to delete chat session",
            details: error.message 
        });
    }
};