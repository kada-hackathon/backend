/**
 * Test CORS configuration for DigitalOcean Spaces
 * Run this script to verify CORS is properly configured
 */

const testCorsConfiguration = async () => {
  const testUrl = `${process.env.OS_URI}/${process.env.OS_BUCKET}/test.txt`;
  
  console.log('\n🔍 Testing CORS Configuration for DigitalOcean Spaces\n');
  console.log('Test URL:', testUrl);
  console.log('Space URI:', process.env.OS_URI);
  console.log('Bucket:', process.env.OS_BUCKET);
  console.log('\n---\n');
  
  try {
    const response = await fetch(testUrl, {
      method: 'HEAD',
      headers: {
        'Origin': 'http://localhost:5173',
      }
    });
    
    console.log('Response Status:', response.status);
    console.log('\nCORS Headers:');
    console.log('  Access-Control-Allow-Origin:', response.headers.get('access-control-allow-origin'));
    console.log('  Access-Control-Allow-Methods:', response.headers.get('access-control-allow-methods'));
    console.log('  Access-Control-Allow-Headers:', response.headers.get('access-control-allow-headers'));
    console.log('  Access-Control-Expose-Headers:', response.headers.get('access-control-expose-headers'));
    
    const allowOrigin = response.headers.get('access-control-allow-origin');
    
    if (allowOrigin === '*' || allowOrigin === 'http://localhost:5173') {
      console.log('\n✅ CORS is properly configured!');
    } else if (!allowOrigin) {
      console.log('\n❌ CORS is NOT configured!');
      console.log('\n📖 Follow these steps:');
      console.log('1. Go to DigitalOcean Dashboard → Spaces → Your Space');
      console.log('2. Click Settings tab');
      console.log('3. Find "CORS Configurations" section');
      console.log('4. Add the configuration from DIGITALOCEAN_SPACES_CORS_SETUP.md');
    } else {
      console.log('\n⚠️  CORS is configured but may not include your origin');
      console.log('Current origin allowed:', allowOrigin);
      console.log('Your app origin:', 'http://localhost:5173');
    }
    
  } catch (error) {
    console.error('\n❌ Error testing CORS:', error.message);
    console.log('\nPossible issues:');
    console.log('- Bucket or file does not exist');
    console.log('- Network connection issue');
    console.log('- Invalid credentials in .env');
  }
  
  console.log('\n---\n');
};

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  testCorsConfiguration();
}

module.exports = { testCorsConfiguration };
