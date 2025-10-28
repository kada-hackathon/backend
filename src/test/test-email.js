require('dotenv').config();
const nodemailer = require('nodemailer');

async function testMail() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    await transporter.verify();
    console.log('✅ Gmail SMTP ready!');
  } catch (err) {
    console.error('❌ SMTP error:', err);
  }
}

testMail();
