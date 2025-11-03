/**
 * Generate embedding using OpenAI-compatible serverless API
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Vector embedding
 */
async function generateEmbedding(text) {
  try {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      throw new Error('Invalid text input for embedding');
    }

    // Use the /v1/embeddings endpoint
    const url = 'https://mlapi.run/4aae6995-00ec-445b-bfc1-cc2689af7c6f/v1/embeddings';
    
    const payload = {
      model: "text-embedding-3-large", // or whichever model your API supports
      input: text.trim(),
      encoding_format: "float" // optional, depends on API
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EMBEDDING_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // OpenAI-compatible format: { data: [{ embedding: [...] }] }
    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error('Invalid embedding format from API');
    }

    const embedding = data.data[0].embedding;
    
    if (!Array.isArray(embedding)) {
      throw new Error('Embedding is not an array');
    }

    return embedding;
    
  } catch (error) {
    throw error;
  }
}

/**
 * Combine title, content, and tags for embedding
 * @param {Object} worklog - WorkLog object with title, content, tag
 * @returns {string} - Combined text for embedding
 */
function prepareTextForEmbedding(worklog) {
  const parts = [];
  
  if (worklog.title) {
    parts.push(`Title: ${worklog.title}`);
  }
  
  if (worklog.content) {
    parts.push(`Content: ${worklog.content}`);
  }
  
  if (worklog.tag && Array.isArray(worklog.tag) && worklog.tag.length > 0) {
    parts.push(`Tags: ${worklog.tag.join(', ')}`);
  }
  
  return parts.join('\n');
}

module.exports = {
  generateEmbedding,
  prepareTextForEmbedding
};