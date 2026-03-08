const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// POST /api/history/send
// body: { to:string, subject?:string, history: array }
router.post('/send', async (req, res) => {
  const { to, subject, history } = req.body || {};
  if (!to || !Array.isArray(history)) {
    return res.status(400).json({ error: 'Recipient (to) and history array required' });
  }

  // build simple CSV from history
  const header = ['name', 'date', 'disease', 'risk', 'accuracy', 'symptoms'];
  const rows = history.map((h) => {
    const date = h.date || '';
    const name = h.userInfo?.name || '';
    const disease = h.result?.prediction_adaboost || '';
    const risk = h.result?.risk_level || '';
    const accuracy = h.result ? Math.round(h.result.accuracy_adaboost * 100) + '%' : '';
    const symptoms = Array.isArray(h.symptoms) ? `"${h.symptoms.join(';')}"` : '';
    return [name, date, disease, risk, accuracy, symptoms].join(',');
  });
  const csv = [header.join(','), ...rows].join('\n');
  const buffer = Buffer.from(csv, 'utf8');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@example.com',
      to,
      subject: subject || 'Prediction history',
      text: 'Attached is your health prediction history.',
      attachments: [{ filename: 'history.csv', content: buffer }],
    });
    res.json({ success: true });
  } catch (err) {
    console.error('history email error', err);
    res.status(500).json({ error: 'Failed to send history email', details: err.toString() });
  }
});

module.exports = router;
