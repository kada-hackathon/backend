// Clear any cached modules first
delete require.cache[require.resolve('../services/mediaService')];

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require('dotenv').config();

// ✅ Valid base64 PNG image (1x1 red pixel)
const sampleBase64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

// ✅ Valid base64 JPEG (1x1 white pixel)
const sampleBase64JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaWmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==';

// ✅ Valid base64 PDF (minimal valid PDF document)
const sampleBase64PDF = 'data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSIAogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo1IDAgb2JqICAlIHBhZ2UgY29udGVudAo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNzkgMDAwMDAgbiAKMDAwMDAwMDE3MyAwMDAwMCBuIAowMDAwMDAwMzAxIDAwMDAwIG4gCjAwMDAwMDAzODAgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDkyCiUlRU9G';

// ✅ Valid base64 video (tiny MP4)
const sampleBase64Video = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAu1tZGF0AAACrQYF//+c3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1MiByMjg1NCBlOWE1OTAzIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTEgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAD2WIhAAz//727L4FNf2f0JcRLMXaSnA=';

// Test function for PNG upload
async function testUploadPNG() {
    console.log('\n🧪 Testing PNG upload...');
    try {
        const { uploadBase64ToSpaces } = require('../services/mediaService');
        const url = await uploadBase64ToSpaces(sampleBase64Image, 'test-image.png', 'image');
        console.log('✅ PNG uploaded successfully!');
        console.log('� URL:', url);
        return { success: true, url };
    } catch (error) {
        console.error('❌ PNG upload failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Test function for JPEG upload
async function testUploadJPEG() {
    console.log('\n🧪 Testing JPEG upload...');
    try {
        const { uploadBase64ToSpaces } = require('../services/mediaService');
        const url = await uploadBase64ToSpaces(sampleBase64JPEG, 'test-image.jpg', 'image');
        console.log('✅ JPEG uploaded successfully!');
        console.log('📍 URL:', url);
        return { success: true, url };
    } catch (error) {
        console.error('❌ JPEG upload failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Test function for PDF upload
async function testUploadPDF() {
    console.log('\n🧪 Testing PDF upload...');
    try {
        const { uploadBase64ToSpaces } = require('../services/mediaService');
        const url = await uploadBase64ToSpaces(sampleBase64PDF, 'test-document.pdf', 'document');
        console.log('✅ PDF uploaded successfully!');
        console.log('📍 URL:', url);
        return { success: true, url };
    } catch (error) {
        console.error('❌ PDF upload failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Test function for video upload
async function testUploadVideo() {
    console.log('\n🧪 Testing Video upload...');
    try {
        const { uploadBase64ToSpaces } = require('../services/mediaService');
        const url = await uploadBase64ToSpaces(sampleBase64Video, 'test-video.mp4', 'video');
        console.log('✅ Video uploaded successfully!');
        console.log('📍 URL:', url);
        return { success: true, url };
    } catch (error) {
        console.error('❌ Video upload failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Media Upload Tests...');
    console.log('🔄 Loading mediaService.js with fresh require...');
    console.log('📅 Date:', new Date().toISOString());
    
    // Check environment variables
    console.log('\n🔍 Environment Variables:');
    console.log('   📦 Bucket:', process.env.OS_BUCKET || '❌ NOT SET');
    console.log('   🌐 Endpoint:', process.env.OS_URI || '❌ NOT SET');
    console.log('   🔑 Access Key:', process.env.OS_ACCESS_KEY ? '✅ SET' : '❌ NOT SET');
    console.log('   🔐 Secret Key:', process.env.OS_SECRET_KEY ? '✅ SET' : '❌ NOT SET');
    
    if (!process.env.OS_BUCKET || !process.env.OS_URI || !process.env.OS_ACCESS_KEY || !process.env.OS_SECRET_KEY) {
        console.error('\n❌ ERROR: Missing required environment variables!');
        process.exit(1);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Testing All Media Types');
    console.log('='.repeat(60));
    
    const results = [];
    
    // Test PNG
    const pngResult = await testUploadPNG();
    results.push({ type: 'PNG Image', ...pngResult });
    
    // Test JPEG
    const jpegResult = await testUploadJPEG();
    results.push({ type: 'JPEG Image', ...jpegResult });
    
    // Test PDF
    const pdfResult = await testUploadPDF();
    results.push({ type: 'PDF Document', ...pdfResult });
    
    // Test Video
    const videoResult = await testUploadVideo();
    results.push({ type: 'MP4 Video', ...videoResult });
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    results.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${result.type}: ${result.success ? 'Success' : 'Failed'}`);
        if (result.url) {
            console.log(`   URL: ${result.url}`);
        }
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Passed: ${successCount}/${results.length}`);
    console.log(`❌ Failed: ${failCount}/${results.length}`);
    console.log('='.repeat(60));
    
    if (failCount > 0) {
        console.log('\n💡 Troubleshooting tips:');
        console.log('1. Check that mediaService.js has: forcePathStyle: true');
        console.log('2. Verify your DigitalOcean Spaces credentials');
        console.log('3. Check bucket permissions and CORS settings');
    } else {
        console.log('\n✨ All tests passed successfully!');
    }
}

// Run all tests
runAllTests().catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
});