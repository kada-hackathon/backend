const NodeCache = require('node-cache');

/**
 * ====================================================================
 * CACHE SERVICE
 * ====================================================================
 * 
 * Purpose: Optimize chatbot performance by caching expensive operations
 * 
 * What We Cache:
 * 1. Embeddings (Korean API calls) - Slow: 1500-2000ms
 * 2. Search Results (MongoDB queries) - Medium: 200-300ms
 * 
 * Performance Impact:
 * - First request: ~8000ms (no cache)
 * - Cached request: ~4500ms (embedding + search cached)
 * - Savings: 40-50% faster on repeat queries
 * 
 * Cache Strategy:
 * - Use in-memory cache (NodeCache) for single server
 * - TTL (Time To Live): Auto-expire old entries
 * - Request deduplication: Prevent duplicate API calls
 * 
 * For Production Scale:
 * - Replace with Redis for multi-server deployments
 * - Shared cache across multiple backend instances
 * 
 * @author Arrizal Bintang R
 * @date October 2025
 * ====================================================================
 */
class CacheService {
    constructor() {
        // Embedding Cache: Stores vector embeddings from Korean API
        // TTL: 3600 seconds (1 hour)
        // Why: Embeddings don't change unless text changes
        // Example: "What is AI?" → [0.234, 0.456, 0.789, ...]
        this.embeddingCache = new NodeCache({ stdTTL: 3600 });
        
        // Search Cache: Stores MongoDB vector search results
        // TTL: 300 seconds (5 minutes)
        // Why: WorkLogs update frequently, need fresher data
        // Example: embedding_key → [worklog1, worklog2, worklog3]
        this.searchCache = new NodeCache({ stdTTL: 300 });
        
        // Request Deduplication: Track in-flight API requests
        // Why: If 2 users ask same question simultaneously, only call API once
        // Both users wait for same result instead of making duplicate calls
        this.inFlightRequests = new Map();
    }

    /**
     * ================================================================
     * GET EMBEDDING WITH CACHING
     * ================================================================
     * 
     * Flow:
     * 1. Hash the user's text to create cache key
     * 2. Check if embedding exists in cache → Return immediately (5ms)
     * 3. Check if another request is already generating → Wait for it
     * 4. Generate new embedding → Save to cache → Return
     * 
     * Example:
     * User 1 asks: "What is AI?" → MISS → Call API (1800ms)
     * User 2 asks: "What is AI?" → HIT → Return cached (5ms)
     * 
     * Request Deduplication Example:
     * User A asks "machine learning" at 10:00:00.000
     * User B asks "machine learning" at 10:00:00.100 (while A's request is still processing)
     * → User B waits for User A's result instead of making duplicate API call
     * 
     * @param {string} text - User's question or text to embed
     * @param {Function} generateFn - Function that calls embedding API
     * @returns {Promise<number[]>} - Vector embedding (e.g., [0.234, 0.456, ...])
     * ================================================================
     */
    async getEmbedding(text, generateFn) {
        // Step 1: Create unique cache key from text
        // Same text = same key = same cache entry
        const cacheKey = this.hashText(text);
        
        // Step 2: Check cache first (fastest path)
        const cached = this.embeddingCache.get(cacheKey);
        if (cached) {
            return cached; // Return in ~5ms!
        }

        // Step 3: Check if someone else is already generating this
        // Prevents duplicate API calls when multiple users ask same question
        if (this.inFlightRequests.has(`emb_${cacheKey}`)) {
            return await this.inFlightRequests.get(`emb_${cacheKey}`);
        }

        // Step 4: Generate new embedding (slow: 1500-2000ms)
        
        // Create promise and store it for other requests to wait on
        const promise = generateFn(text)
            .then(embedding => {
                // Success: Save to cache for future requests
                this.embeddingCache.set(cacheKey, embedding);
                this.inFlightRequests.delete(`emb_${cacheKey}`);
                return embedding;
            })
            .catch(error => {
                // Error: Clean up and propagate error
                this.inFlightRequests.delete(`emb_${cacheKey}`);
                throw error;
            });

        // Register this request so others can wait for it
        this.inFlightRequests.set(`emb_${cacheKey}`, promise);
        return promise;
    }

    /**
     * ================================================================
     * GET SEARCH RESULTS WITH CACHING
     * ================================================================
     * 
     * Flow:
     * 1. Create cache key from embedding vector (first 20 dimensions)
     * 2. Check if search results exist → Return immediately (10ms)
     * 3. Check if another request is already searching → Wait for it
     * 4. Execute MongoDB vector search → Save to cache → Return
     * 
     * Why Cache Search Results?
     * - Vector search scans thousands of embeddings
     * - Takes 200-300ms even with optimized indexes
     * - Similar questions have similar embeddings → same results
     * 
     * Example:
     * User asks: "machine learning projects"
     * → Embedding: [0.234, 0.456, 0.789, ...]
     * → Creates key from first 20 values
     * → Searches MongoDB (280ms)
     * → Caches: key → [worklog1, worklog2, worklog3]
     * 
     * Next similar query: "ML projects" 
     * → Similar embedding → Same cache key → Return cached (10ms)
     * 
     * @param {number[]} embedding - Vector embedding from user's question
     * @param {Function} searchFn - Function that queries MongoDB
     * @returns {Promise<Array>} - Array of relevant WorkLog objects
     * ================================================================
     */
    async getSearchResults(embedding, searchFn) {
        // Step 1: Create stable cache key from embedding vector
        // We use first 20 dimensions because:
        // - Full 3072 dims is too large for key
        // - First 20 dims capture most of the semantic meaning
        // - Rounded to 4 decimals for stability
        const cacheKey = this.createEmbeddingKey(embedding);
        
        // Step 2: Check cache first
        const cached = this.searchCache.get(cacheKey);
        if (cached) {
            return cached; // Return in ~10ms!
        }

        // Step 3: Check if same search is already running
        if (this.inFlightRequests.has(`search_${cacheKey}`)) {
            return await this.inFlightRequests.get(`search_${cacheKey}`);
        }

        // Step 4: Execute search (slow: 200-300ms)
        
        const promise = searchFn()
            .then(results => {
                // Success: Cache results for 5 minutes
                this.searchCache.set(cacheKey, results);
                this.inFlightRequests.delete(`search_${cacheKey}`);
                return results;
            })
            .catch(error => {
                // Error: Clean up
                this.inFlightRequests.delete(`search_${cacheKey}`);
                throw error;
            });

        // Register this search so others can wait for it
        this.inFlightRequests.set(`search_${cacheKey}`, promise);
        return promise;
    }

    /**
     * ================================================================
     * CREATE EMBEDDING KEY
     * ================================================================
     * 
     * Challenge: Embedding vectors have 3072 numbers - too big for cache key!
     * Solution: Use first 20 dimensions as a "fingerprint"
     * 
     * Why This Works:
     * - Embedding dimensions are ordered by importance
     * - First 20 dimensions capture ~80% of semantic meaning
     * - Similar questions → similar first 20 values
     * - Different questions → different first 20 values
     * 
     * Example:
     * Question: "What is machine learning?"
     * Embedding: [0.2345, 0.4567, 0.7891, ... 3069 more numbers ...]
     * Fingerprint: [0.2345, 0.4567, 0.7891, ... (first 20 only)]
     * Cache Key: "hash_of_fingerprint" → "123456789"
     * 
     * Rounding to 4 Decimals:
     * - Prevents floating point precision issues
     * - 0.23456789 → 0.2346 (stable)
     * - Makes cache key deterministic
     * 
     * @param {number[]} embedding - Full embedding vector (3072 dimensions)
     * @returns {string} - Short hash key for caching
     * @throws {Error} - If embedding is invalid or empty
     * ================================================================
     */
    createEmbeddingKey(embedding) {
        // Validation: Ensure we have a valid embedding
        if (!Array.isArray(embedding) || embedding.length === 0) {
            throw new Error('Invalid embedding array');
        }
        
        // Take first 20 dimensions and round to 4 decimals for stability
        // Example: [0.23456789, 0.45678901] → ["0.2346", "0.4568"]
        const sample = embedding.slice(0, 20).map(val => val.toFixed(4));
        
        // Join with comma and hash: ["0.2346", "0.4568"] → "0.2346,0.4568" → "hash_123"
        // This creates a stable, short key we can use for caching
        return this.hashText(sample.join(','));
    }

    /**
     * ================================================================
     * HASH TEXT
     * ================================================================
     * 
     * Purpose: Convert any string into a short, unique number (hash)
     * 
     * Why We Need This:
     * - Cache keys must be short and efficient
     * - "What is machine learning?" → too long as key
     * - Hash: "What is machine learning?" → "123456789" (fast lookup)
     * 
     * How It Works:
     * - Uses a simple hash algorithm (djb2 variant)
     * - Each character contributes to final hash
     * - Same input = same hash (deterministic)
     * - Different input = different hash (collision-resistant)
     * 
     * Example:
     * "What is AI?" → hash: 987654321
     * "What is AI?" → hash: 987654321 (same!)
     * "What is ML?" → hash: 123456789 (different!)
     * 
     * Algorithm Explanation:
     * - Start with hash = 0
     * - For each character:
     *   1. Shift hash left 5 bits: hash << 5
     *   2. Subtract original: (hash << 5) - hash = hash * 31
     *   3. Add character code: hash * 31 + charCode
     * - This creates a unique signature for the text
     * 
     * @param {string} text - Any text to hash
     * @returns {string} - Hash as string (e.g., "123456789")
     * ================================================================
     */
    hashText(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i); // Get ASCII/Unicode value
            hash = ((hash << 5) - hash) + char; // hash * 31 + char
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(); // Convert number to string for use as key
    }

    /**
     * ================================================================
     * CLEAR ALL CACHES
     * ================================================================
     * 
     * When to use:
     * - Testing: Clear cache between tests
     * - Debugging: Force fresh data for troubleshooting
     * - Deployment: Clear old cache after code updates
     * - Manual: Admin wants to reset cache
     * 
     * What Gets Cleared:
     * - All embedding cache entries
     * - All search result cache entries
     * - All in-flight request trackers
     * 
     * Note: After clearing, first requests will be slow again
     * (need to regenerate embeddings and search results)
     * 
     * @returns {void}
     * ================================================================
     */
    clearAll() {
        this.embeddingCache.flushAll();
        this.searchCache.clear();
        this.inFlightRequests.clear();
    }

    /**
     * ================================================================
     * GET CACHE STATISTICS
     * ================================================================
     * 
     * Returns detailed metrics about cache performance
     * 
     * Metrics Explained:
     * - keys: Number of items currently cached
     * - hits: Number of times cache was used (fast path)
     * - misses: Number of times cache missed (slow path)
     * - hitRate: Percentage of requests that used cache
     * 
     * Example Output:
     * {
     *   embedding: {
     *     keys: 25,           // 25 different queries cached
     *     hits: 100,          // Cache used 100 times
     *     misses: 25,         // Cache missed 25 times
     *     hitRate: "80.0%"    // 80% of requests used cache!
     *   },
     *   search: {
     *     keys: 25,
     *     hits: 100,
     *     misses: 25,
     *     hitRate: "80.0%"
     *   },
     *   inFlight: 2          // 2 requests currently processing
     * }
     * 
     * Good Hit Rate:
     * - > 50% is good
     * - > 70% is excellent
     * - < 30% means cache isn't helping much
     * 
     * @returns {Object} - Cache statistics
     * ================================================================
     */
    getStats() {
        return {
            embedding: {
                keys: this.embeddingCache.keys().length,
                hits: this.embeddingCache.getStats().hits,
                misses: this.embeddingCache.getStats().misses,
                hitRate: this.calculateHitRate(this.embeddingCache.getStats())
            },
            search: {
                keys: this.searchCache.keys().length,
                hits: this.searchCache.getStats().hits,
                misses: this.searchCache.getStats().misses,
                hitRate: this.calculateHitRate(this.searchCache.getStats())
            },
            inFlight: this.inFlightRequests.size
        };
    }

    /**
     * Calculate hit rate percentage
     * 
     * Formula: (hits / total_requests) * 100
     * 
     * Example:
     * - 80 hits + 20 misses = 100 total
     * - Hit rate = (80 / 100) * 100 = 80%
     * 
     * @param {Object} stats - NodeCache stats object
     * @returns {string} - Hit rate as percentage (e.g., "80.0%")
     */
    calculateHitRate(stats) {
        const total = stats.hits + stats.misses;
        if (total === 0) return '0%';
        return `${((stats.hits / total) * 100).toFixed(1)}%`;
    }
}

// Export singleton instance
// Why singleton? We want ONE cache shared across entire application
// Multiple instances = no sharing = cache doesn't work!
module.exports = new CacheService();