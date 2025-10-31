require('dotenv').config();

async function testEmbedding() {
  const baseUrl = 'https://mlapi.run/4aae6995-00ec-445b-bfc1-cc2689af7c6f';
  
  console.log('Testing with /v1/embeddings endpoint...\n');

  // Try different model names
  const modelsToTry = [
    'text-embedding-3-large',
    'text-embedding-3-small',
    'text-embedding-ada-002',
    'embedding-001', // Generic
  ];

  for (const model of modelsToTry) {
    console.log(`\n--- Testing model: ${model} ---`);
    
    const payload = {
      model: model,
      input: "Test embedding generation"
    };

    try {
      const response = await fetch(`${baseUrl}/v1/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EMBEDDING_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ ${model}: ${response.status} - ${errorText}`);
        continue;
      }

      const data = await response.json();
      
      if (data.data && data.data[0] && data.data[0].embedding) {
        console.log(`✅ ${model}: SUCCESS!`);
        console.log(`   Dimensions: ${data.data[0].embedding.length}`);
        console.log(`   Sample response:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
        break; // Found working model
      }
      
    } catch (error) {
      console.log(`❌ ${model}: ${error.message}`);
    }
  }
}

testEmbedding();