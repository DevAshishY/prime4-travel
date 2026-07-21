const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const adminEmail = process.env.ADMIN_EMAIL || 'prime4travels@gmail.com';
const whatsappNumber = process.env.WHATSAPP_NUMBER || '919956531108';
const databaseUrl = process.env.DATABASE_URL || null;

let dbPool = null;
if (databaseUrl) {
  dbPool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

console.log('\n=== Prime4Travels Server Config ===');
console.log(`SMTP Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
console.log(`SMTP Port: ${process.env.SMTP_PORT || 465}`);
console.log(`SMTP User configured: ${!!process.env.SMTP_USER}`);
console.log(`SMTP Pass configured: ${!!process.env.SMTP_PASS}`);
console.log(`Admin Email: ${adminEmail}`);
console.log('===================================\n');

async function saveInquiry(data) {
  if (!dbPool) return;
  const createTableSql = `CREATE TABLE IF NOT EXISTS enquiries (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    destination TEXT NOT NULL,
    message TEXT,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;
  await dbPool.query(createTableSql);
  const insertSql = `INSERT INTO enquiries (name, phone, start_date, end_date, destination, message)
    VALUES ($1, $2, $3, $4, $5, $6)`;
  await dbPool.query(insertSql, [data.name, data.phone, data.startDate, data.endDate, data.destination, data.message]);
}

// Basic CORS and request logging to simplify local testing from file:// or other origins
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Simple health endpoint
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Test enquiry endpoint to exercise email flow without UI
app.post('/api/test-enquiry', async (req, res) => {
  const data = req.body || { name: 'Test', phone: '9999999999', startDate: new Date().toISOString().slice(0,10), endDate: new Date().toISOString().slice(0,10), destination: 'Kanpur', message: 'test' };
  console.log('[TEST-ENQUIRY] Request received:', data);
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('[TEST-ENQUIRY] SMTP not configured — logging test enquiry');
      return res.json({ message: 'Test enquiry logged (SMTP not configured).', data });
    }
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL || adminEmail,
      subject: 'Test Traveller Booking Enquiry – Prime4Travels',
      text: `Test enquiry from ${data.name}\nPhone: ${data.phone}\nStart Date: ${data.startDate}\nEnd Date: ${data.endDate}\nDestination: ${data.destination}\nMessage: ${data.message || 'N/A'}`,
    };
    console.log('[TEST-ENQUIRY] Sending email to:', mailOptions.to);
    const info = await transporter.sendMail(mailOptions);
    console.log('[TEST-ENQUIRY] Email sent successfully. MessageID:', info.messageId);
    return res.json({ message: 'Test enquiry email sent (SMTP configured).', messageId: info.messageId });
  } catch (err) {
    console.error('[TEST-ENQUIRY] Error:', err.message);
    console.error('[TEST-ENQUIRY] Full error:', err);
    return res.status(500).json({ message: 'Failed to send test enquiry.', error: err.message });
  }
});

app.post('/api/enquiry', async (req, res) => {
  const { name, phone, startDate, endDate, destination, message } = req.body;
  if (!name || !phone || !startDate || !endDate || !destination) {
    return res.status(400).json({ message: 'Missing required enquiry fields.' });
  }
  if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
    return res.status(400).json({ message: 'Invalid mobile number format.' });
  }
  try {
    await saveInquiry({ name, phone, startDate, endDate, destination, message });
    const mailOptions = {
      from: process.env.SMTP_USER || `no-reply@${req.hostname}`,
      to: adminEmail,
      subject: 'New Traveller Booking Enquiry – Prime4Travels',
      text: `New enquiry from ${name}\nPhone: ${phone}\nStart Date: ${startDate}\nEnd Date: ${endDate}\nDestination: ${destination}\nMessage: ${message || 'N/A'}\nWhatsApp: https://wa.me/${whatsappNumber}`,
    };
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('[ENQUIRY] SMTP not configured — enquiry logged:', mailOptions);
      return res.json({ message: 'Enquiry received and logged (SMTP not configured).' });
    }

    console.log('[ENQUIRY] Sending email to:', mailOptions.to);
    const info = await transporter.sendMail(mailOptions);
    console.log('[ENQUIRY] Email sent successfully. MessageID:', info.messageId);
    return res.json({ message: 'Enquiry received successfully.', messageId: info.messageId });
  } catch (error) {
    console.error('[ENQUIRY] Error:', error.message);
    console.error('[ENQUIRY] Full error:', error);
    return res.status(500).json({ message: 'Failed to submit enquiry. Please try again later.', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Prime4Travels site running on http://localhost:${port}`);
});
