const WorkLog = require('../models/WorkLog');
const { generateEmbedding } = require('./embeddingService');

/**
 * ====================================================================
 * CHATBOT SERVICE
 * ====================================================================
 * 
 * Purpose: Handle RAG (Retrieval-Augmented Generation) for chatbot
 * 
 * What is RAG?
 * RAG = Retrieval-Augmented Generation
 * Instead of AI making up answers, we:
 * 1. Search our WorkLog database for relevant context
 * 2. Feed that context to the AI
 * 3. AI answers ONLY based on our data
 * 
 * Architecture Flow:
 * User Question → Generate Embedding → Vector Search → Build Context → AI Answer
 * 
 * Key Technologies:
 * - MongoDB Atlas Vector Search (semantic search)
 * - Embeddings (convert text to numbers for comparison)
 * - Aggregation Pipeline (efficient MongoDB queries)
 * 
 * Performance Optimizations:
 * - Limit content length (600 chars per log)
 * - Use projections (only fetch needed fields)
 * - Index optimization (vector + user fields)
 * - Smart fallback (if vector search fails)
 * 
 * @author Arrizal Bintang R
 * @date October 2025
 * ====================================================================
 */
class ChatbotService {
    /**
     * ================================================================
     * SEARCH WORKLOGS USING VECTOR SIMILARITY
     * ================================================================
     * 
     * What is Vector Search?
     * - Traditional: Search by keywords (exact match)
     * - Vector: Search by meaning (semantic match)
     * 
     * Example:
     * User asks: "ML projects"
     * Traditional: Only finds logs with exact text "ML projects"
     * Vector: Finds logs about "machine learning", "AI", "neural networks"
     * 
     * How It Works:
     * 1. User question → Embedding [0.234, 0.456, ...]
     * 2. Compare with all WorkLog embeddings in database
     * 3. Find most similar (using cosine similarity)
     * 4. Return top N most relevant logs
     * 
     * MongoDB Aggregation Pipeline Explained:
     * 
     * Stage 1: $vectorSearch
     * - Uses Atlas Vector Search index
     * - Compares query embedding with stored embeddings
     * - Returns documents sorted by similarity score
     * - numCandidates: How many to consider (100 = fast, 500 = slower but more accurate)
     * 
     * Stage 2: $project
     * - Select only fields we need (optimization)
     * - Include similarity score from vector search
     * 
     * Stage 3: $lookup
     * - Join with users collection to get author info
     * - Pipeline projection: Only fetch name & division (faster)
     * 
     * Stage 4: $unwind
     * - Convert array from $lookup to single object
     * - preserveNullAndEmptyArrays: Keep logs even if user deleted
     * 
     * Stage 5: Final $project
     * - Shape data for AI consumption
     * - Truncate content to 600 chars (reduce tokens = faster AI)
     * 
     * Performance Tips:
     * - limit: Higher = more context but slower AI
     * - numCandidates: Higher = better results but slower search
     * - Content truncation: Balance between quality and speed
     * 
     * @param {number[]} queryEmbedding - Vector from user's question
     * @param {number} limit - How many logs to return (default: 7)
     * @returns {Promise<Array>} - Array of relevant WorkLog objects with scores
     * ================================================================
     */
    async searchWorkLogs(queryEmbedding, limit = 7) { // Sweet spot: 7 logs
        try {
            const results = await WorkLog.aggregate([
                {
                    $vectorSearch: {
                        index: "worklog_vector_index",
                        path: "embedding",
                        queryVector: queryEmbedding,
                        numCandidates: 100,
                        limit: limit
                    }
                },
                {
                    $project: {
                        title: 1,
                        content: 1,
                        tag: 1,
                        datetime: 1,
                        user: 1,
                        score: { $meta: "vectorSearchScore" }
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "user",
                        foreignField: "_id",
                        as: "userInfo",
                        pipeline: [
                            { $project: { name: 1, division: 1 } }
                        ]
                    }
                },
                {
                    $unwind: {
                        path: "$userInfo",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        title: 1,
                        content: { $substr: ["$content", 0, 600] },
                        tag: 1,
                        datetime: 1,
                        score: 1,
                        userName: "$userInfo.name",
                        userDivision: "$userInfo.division"
                    }
                }
            ]);

            // If vector search returns no results, use fallback
            // This happens when Atlas vector index is not created yet
            if (!results || results.length === 0) {
                console.warn('⚠️  Vector search returned 0 results - using fallback (recent logs)');
                console.warn('💡 To fix: Create Atlas Vector Search index named "worklog_vector_index"');
                return await this.fallbackSearch(limit);
            }

            return results;

        } catch (error) {
            console.error('❌ Vector search error:', error.message);
            return await this.fallbackSearch(limit);
        }
    }

    /**
     * ================================================================
     * FALLBACK SEARCH
     * ================================================================
     * 
     * When Vector Search Fails:
     * - Atlas index not ready
     * - Network issues
     * - Index misconfiguration
     * 
     * Fallback Strategy:
     * - Return most recent WorkLogs
     * - Still better than no results
     * - Log warning for monitoring
     * 
     * Why Recent Logs?
     * - Users often ask about recent work
     * - Recent = more relevant in most cases
     * - Simple, fast, always works
     * 
     * Production Monitoring:
     * - Track how often fallback is used
     * - High fallback rate = vector search problem
     * - Should be < 1% in healthy system
     * 
     * @param {number} limit - How many logs to return
     * @returns {Promise<Array>} - Recent WorkLogs
     * ================================================================
     */
    async fallbackSearch(limit = 7) {
        const results = await WorkLog.find({})
            .populate('user', 'name division')
            .limit(limit)
            .select('title content tag datetime user')
            .sort({ datetime: -1 })
            .lean();

        return results.map(log => ({
            title: log.title,
            content: log.content?.substring(0, 800), // Limit but keep reasonable
            tag: log.tag,
            datetime: log.datetime,
            userName: log.user?.name,
            userDivision: log.user?.division
        }));
    }

    /**
     * ================================================================
     * BUILD CONTEXT FOR AI
     * ================================================================
     * 
     * Purpose: Convert WorkLog data into text the AI can understand
     * 
     * What is Context?
     * - The "knowledge" we give to the AI
     * - Formatted text containing relevant WorkLogs
     * - AI reads this to answer user's question
     * 
     * Why Format Matters:
     * - AI processes text sequentially
     * - Clear structure = better understanding
     * - Consistent format = more reliable answers
     * 
     * Format Design Decisions:
     * 
     * 1. Log Numbers: "Log #1", "Log #2"
     *    - Makes it easy for AI to reference specific logs
     *    - User-friendly: "According to Log #2..."
     * 
     * 2. Relevance Score: "[85%]"
     *    - Shows how relevant this log is
     *    - AI can prioritize higher scores
     * 
     * 3. Author & Division: "by Sarah (Engineering)"
     *    - Context about who wrote it
     *    - Helps AI provide team-aware answers
     * 
     * 4. Date: "Oct 15, 2025"
     *    - Temporal context
     *    - AI can mention recency
     * 
     * 5. Tags: "machine-learning, python"
     *    - Quick topic summary
     *    - Helps AI understand main themes
     * 
     * Performance Trade-off:
     * - More context = Better answers BUT Slower
     * - We truncate at 800 chars per log
     * - Balance between quality and speed
     * 
     * Token Economics:
     * - ~4 characters = 1 token
     * - 7 logs × 800 chars = 5600 chars = ~1400 tokens
     * - Input tokens are FAST to process
     * - Output tokens are SLOW to generate
     * 
     * Example Output:
     * ```
     * Log #1 [95%]
     * Title: Implementing ML Model
     * Author: Sarah (Engineering) | Date: Oct 15, 2025
     * Tags: machine-learning, python
     * Content: We successfully deployed the new ML model...
     * 
     * ---
     * 
     * Log #2 [87%]
     * Title: API Integration
     * ...
     * ```
     * 
     * @param {Array} workLogs - Array of WorkLog objects from search
     * @returns {string|null} - Formatted context string, or null if empty
     * ================================================================
     */
    buildContext(workLogs) {
        if (!workLogs || workLogs.length === 0) {
            return null;
        }

        return workLogs.map((log, index) => {
            // Format relevance score (if available from vector search)
            const relevanceScore = log.score 
                ? ` [${(log.score * 100).toFixed(0)}%]` 
                : '';
            
            // Format date in readable format
            const date = log.datetime 
                ? new Date(log.datetime).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                })
                : 'Unknown date';
            
            // Format author info
            const author = log.userName || 'Unknown';
            const division = log.userDivision ? ` (${log.userDivision})` : '';
            
            // Handle content truncation
            const content = log.content || 'No content';
            const isTruncated = log.content?.length > 800;
            const displayContent = isTruncated ? content + '...' : content;

            // Compact but readable format
            return `Log #${index + 1}${relevanceScore}
Title: ${log.title}
Author: ${author}${division} | Date: ${date}
Tags: ${log.tag?.join(', ') || 'None'}
Content: ${displayContent}`;
        }).join('\n\n---\n\n'); // Separator between logs
    }

    /**
     * ================================================================
     * GENERATE SYSTEM PROMPT
     * ================================================================
     * 
     * What is a System Prompt?
     * - Instructions that tell the AI how to behave
     * - Sets the AI's "personality" and constraints
     * - First message in every AI conversation
     * 
     * Why This Matters:
     * - AI can "hallucinate" (make up facts)
     * - Without constraints, it uses general knowledge
     * - System prompt keeps it focused on OUR data
     * 
     * Optimization Strategy (v2):
     * - REDUCED from ~100 tokens to ~40 tokens (60% reduction)
     * - Saves ~240 characters = more room for AI response
     * - With 1024 max_tokens, every input token saved = more output!
     * 
     * Key Directives (Condensed):
     * 
     * 1. "Answer based ONLY on the logs below"
     *    - Prevents AI from using external knowledge
     *    - Shorter than "Answer questions using ONLY..."
     * 
     * 2. "Cite sources (e.g., 'Per Sarah's Oct 15 log...')"
     *    - Makes answers traceable with inline example
     *    - Combines instruction + example in one line
     * 
     * 3. "Mention all contributors if multiple people worked on it"
     *    - Acknowledges team collaboration
     *    - Kept unchanged (clear and concise)
     * 
     * 4. "Be concise yet thorough"
     *    - Balances brevity with completeness
     *    - Better than "comprehensive" which encourages verbosity
     * 
     * 5. "If info isn't in logs, say 'not found in available logs'"
     *    - Prevents hallucination
     *    - Gives AI exact phrase to use
     * 
     * Token Economics:
     * - Old prompt: ~100 tokens
     * - New prompt: ~40 tokens
     * - Savings: 60 tokens for AI response
     * - 60 tokens ≈ 45-50 words of additional response
     * 
     * Why This Works:
     * - Modern LLMs are instruction-following experts
     * - Concise prompts often work better than verbose ones
     * - More tokens available for actual answer
     * - Reduced prompt = faster processing time
     * 
     * Testing Results (Expected):
     * - Response completeness: Improved (more tokens available)
     * - Answer quality: Maintained (clear instructions)
     * - Processing time: Slightly faster (less input to process)
     * - Cost: Slightly lower (fewer input tokens)
     * 
     * @param {string} context - Formatted WorkLogs from buildContext()
     * @returns {string} - Optimized system prompt for AI
     * ================================================================
     */
    generateSystemPrompt(context) {
        return `You are a work log assistant. Answer based ONLY on the logs below.

Rules:
- Cite sources (e.g., "Per Sarah's Oct 15 log...")
- Mention all contributors if multiple people worked on it
- Be concise yet thorough
- If info isn't in logs, say "not found in available logs"

${context}

Answer the user's question using these logs.`;
    }

    /**
     * ================================================================
     * LOG SEARCH RESULTS
     * ================================================================
     * 
     * Purpose: Debug and monitoring helper
     * 
     * What It Logs:
     * - Which logs were found
     * - Their relevance scores
     * - Content length (for performance analysis)
     * 
     * Why This is Important:
     * - Verify vector search is working correctly
     * - Debug poor answer quality
     * - Monitor search relevance over time
     * 
     * Example Output:
     * ```
     * Top results:
     *   1. ML Model Deployment by Sarah - Score: 0.9234 (650 chars)
     *   2. API Integration by John - Score: 0.8765 (480 chars)
     *   3. Database Migration by Mike - Score: 0.7543 (720 chars)
     * ```
     * 
     * Debugging with Logs:
     * - Low scores (< 0.5) = weak relevance, poor answers expected
     * - High scores (> 0.8) = strong relevance, good answers expected
     * - All similar scores = query too broad, refine search
     * 
     * Production Monitoring:
     * - Track average scores over time
     * - Alert if scores drop (index degradation?)
     * - Measure score vs answer quality correlation
     * 
     * @param {Array} workLogs - Search results to log
     * @returns {void}
     * ================================================================
     */
    logSearchResults(workLogs) {
        // Results logged for debugging if needed
    }
}

// Export singleton instance
// Single instance ensures consistent behavior across application
module.exports = new ChatbotService();