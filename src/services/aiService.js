/**
 * ====================================================================
 * AI SERVICE
 * ====================================================================
 * 
 * Purpose: Handle communication with external AI/LLM API
 * 
 * Provider: DigitalOcean AI Inference
 * Model: deepseek-r1-distill-llama-70b
 * 
 * What This Service Does:
 * 1. Formats requests for AI API
 * 2. Manages timeouts and error handling
 * 3. Tracks performance metrics
 * 4. Handles retries (future enhancement)
 * 
 * Why Separate Service?
 * - Easy to swap AI providers
 * - Centralized error handling
 * - Performance monitoring in one place
 * - Testable in isolation
 * 
 * Performance Characteristics:
 * - Geographic latency: 200-400ms (Asia → USA)
 * - Model inference: 3000-5000ms (token generation)
 * - Total: 4000-7000ms per request
 * 
 * Cost Considerations:
 * - Input tokens: ~$0.000002 per token
 * - Output tokens: ~$0.00001 per token (5x more expensive!)
 * - 1024 max_tokens = ~$0.01 per request
 * 
 * Future Enhancements:
 * - Streaming responses (text appears gradually)
 * - Retry logic with exponential backoff
 * - Multiple model support (fallback to cheaper model)
 * - Response caching (careful: each answer should be unique)
 * 
 * @author Arrizal Bintang Ramadhan
 * @date October 2025
 * ====================================================================
 */
class AIService {
    constructor() {
        // API Configuration
        this.apiUrl = "https://inference.do-ai.run/v1/chat/completions";
        this.model = "deepseek-r1-distill-llama-70b";
        
        // Performance tracking
        // Stores last 100 response times for averaging
        this.requestTimes = [];
    }

    /**
     * ================================================================
     * GENERATE AI RESPONSE
     * ================================================================
     * 
     * Purpose: Get AI-generated answer based on WorkLog context
     * 
     * Request Flow:
     * 1. Format request with system + user messages
     * 2. Add timeout protection (15 seconds)
     * 3. Send to AI API
     * 4. Parse and validate response
     * 5. Track performance metrics
     * 
     * Message Roles Explained:
     * - system: Instructions for AI behavior (how to act)
     * - user: The actual question from user
     * - assistant: AI's response (not sent, but would be for conversations)
     * 
     * Parameters Explained:
     * 
     * max_tokens: 1024
     * - Maximum length of AI response
     * - More tokens = longer answer BUT slower + more expensive
     * - 1024 tokens ≈ 700-800 words (comprehensive without truncation)
     * 
     * temperature: 0.75
     * - Controls randomness/creativity
     * - 0.0 = deterministic, same answer every time
     * - 1.0 = very creative, might hallucinate
     * - 0.75 = balanced, focused but natural
     * 
     * top_p: 0.9
     * - Nucleus sampling parameter
     * - Consider only top 90% probable tokens
     * - Reduces nonsensical outputs
     * - Works with temperature for quality control
     * 
     * Token Estimation:
     * - 1 token ≈ 4 characters
     * - "What is machine learning?" ≈ 6 tokens
     * - Context (7 logs × 800 chars) ≈ 1400 tokens
     * - Total input: ~1500 tokens
     * - Output: up to 1024 tokens
     * 
     * Processing Time Breakdown:
     * - Network latency: 200-400ms (Asia → USA)
     * - Input processing: 1ms per token × 1500 = 1500ms
     * - Output generation: 10-15ms per token × 1024 = 10240-15360ms
     * - Total: 11940-17260ms (may take longer with increased tokens)
     * 
     * Error Scenarios:
     * - Timeout: > 15 seconds (geographic issues, server overload)
     * - 429: Rate limit exceeded (too many requests)
     * - 500: Server error (retry might work)
     * - 401: Invalid API key
     * 
     * @param {string} systemPrompt - Instructions + context for AI
     * @param {string} userMessage - User's question
     * @returns {Promise<string>} - AI's answer
     * @throws {Error} - On timeout, API error, or invalid response
     * ================================================================
     */
    async generateResponse(systemPrompt, userMessage) {
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.MODEL_ACCESS_KEY}`
        };

        if (!process.env.MODEL_ACCESS_KEY) {
            throw new Error("MODEL_ACCESS_KEY not configured");
        }

        const payload = {
            model: this.model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            max_tokens: 1024, // Increased to prevent response truncation
            temperature: 0.75, // Balanced: creative but focused
            top_p: 0.9
        };

        // Estimate token counts for monitoring
        // Why? Helps us understand costs and performance
        const startTime = Date.now();
        
        try {
            // Timeout protection: Abort request after 20 seconds
            // Why 20s? Geographic latency (400ms) + max generation time (15360ms) + buffer
            // Without timeout, request could hang indefinitely
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);

            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(payload),
                signal: controller.signal // Connects timeout to request
            });

            clearTimeout(timeoutId); // Request finished, cancel timeout

            // Check HTTP status
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`AI service unavailable: ${response.status}`);
            }

            // Parse JSON response
            const data = await response.json();

            // Validate response structure
            // API should return: { choices: [{ message: { content: "answer" } }] }
            if (!data.choices || !data.choices[0]) {
                throw new Error("Invalid AI response structure");
            }

            const aiAnswer = data.choices[0].message?.content?.trim();

            // Ensure we got actual content
            if (!aiAnswer) {
                throw new Error(`Empty AI response`);
            }

            // Track performance
            const duration = Date.now() - startTime;
            this.requestTimes.push(duration);
            if (this.requestTimes.length > 100) this.requestTimes.shift(); // Keep only last 100
            
            return aiAnswer;

        } catch (error) {
            // Handle timeout specifically
            if (error.name === 'AbortError') {
                throw new Error('AI request timed out after 20 seconds');
            }
            // Propagate other errors
            throw error;
        }
    }

    /**
     * ================================================================
     * GET AVERAGE RESPONSE TIME
     * ================================================================
     * 
     * Purpose: Track AI performance over time
     * 
     * Why Track This?
     * - Detect performance degradation
     * - Capacity planning (need faster model?)
     * - SLA monitoring (are we meeting targets?)
     * - Cost optimization (slower = more expensive)
     * 
     * How It Works:
     * - Stores last 100 request times in array
     * - Calculates average on demand
     * - Rolling window prevents old data from skewing results
     * 
     * Interpreting Results:
     * - < 5000ms: Excellent
     * - 5000-7000ms: Normal (our current range)
     * - 7000-10000ms: Slow, investigate
     * - > 10000ms: Critical, check API status
     * 
     * Production Monitoring:
     * - Alert if avg exceeds 8000ms
     * - Track trends (improving or degrading?)
     * - Correlate with user complaints
     * 
     * @returns {number} - Average response time in milliseconds
     * ================================================================
     */
    getAverageResponseTime() {
        if (this.requestTimes.length === 0) return 0;
        const sum = this.requestTimes.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.requestTimes.length);
    }

    /**
     * ================================================================
     * GET STATISTICS
     * ================================================================
     * 
     * Purpose: Provide performance metrics for monitoring
     * 
     * Returns:
     * - averageResponseTime: Mean of last 100 requests
     * - totalRequests: How many requests tracked
     * - recentTimes: Last 10 response times (for trend analysis)
     * 
     * Use Cases:
     * - Admin dashboard
     * - Health check endpoint
     * - Performance debugging
     * - Capacity planning reports
     * 
     * Example Output:
     * {
     *   averageResponseTime: 6543,
     *   totalRequests: 100,
     *   recentTimes: [6234, 7123, 5876, 6543, 7234, ...]
     * }
     * 
     * @returns {Object} - Performance statistics
     * ================================================================
     */
    getStats() {
        return {
            averageResponseTime: this.getAverageResponseTime(),
            totalRequests: this.requestTimes.length,
            recentTimes: this.requestTimes.slice(-10) // Last 10 for trend
        };
    }
}

// Export singleton instance
// Single instance maintains consistent performance history
module.exports = new AIService();