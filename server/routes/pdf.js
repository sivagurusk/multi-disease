const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const pdf = require('html-pdf');
const nodemailer = require('nodemailer');

// POST /api/pdf with JSON body containing user info and results
// also supports GET with query params for basic name
router.post('/', async (req, res) => {
  const data = req.body || {};
  const {
    name = 'User',
    age,
    gender,
    contact,
    symptoms,
    prediction,
    accuracy,
    risk,
    recommendation,
    probability_distribution,
    next_steps,
  } = data;


  const templatePath = path.join(__dirname, '..', 'pdf', 'template.html');
  try {
    const html = fs.readFileSync(templatePath, 'utf8');
    const riskColor = risk === 'High' ? '#e74c3c' : risk === 'Medium' ? '#f39c12' : '#27ae60';
    // render main PDF
    const rendered = ejs.render(html, {
      name,
      age,
      gender,
      contact,
      symptoms,
      prediction,
      accuracy,
      risk,
      recommendation,
      probability_distribution,
      next_steps,
      match_counts: data.match_counts,
      riskColor,
    });
    const options = { format: 'Letter' };
    pdf.create(rendered, options).toStream((err, stream) => {
      if (err) {
        console.error(err);
        return res.status(500).send('PDF generation error');
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="report-${name}.pdf"`);
      stream.pipe(res);
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Template read error');
  }
});

// maintain GET for backward compatibility
router.get('/', (req, res) => {
  const name = req.query.name || 'User';
  const templatePath = path.join(__dirname, '..', 'pdf', 'template.html');
  try {
    const html = fs.readFileSync(templatePath, 'utf8');
    const rendered = ejs.render(html, { name, riskColor: '#4e73df', match_counts: [] });
    const options = { format: 'Letter' };
    pdf.create(rendered, options).toStream((err, stream) => {
      if (err) {
        console.error(err);
        return res.status(500).send('PDF generation error');
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="report-${name}.pdf"`);
      stream.pipe(res);
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Template read error');
  }
});

// send generated PDF via email
router.post('/send', async (req, res) => {
  const {
    to,
    subject,
    name = 'User',
    age,
    gender,
    contact,
    symptoms,
    prediction,
    accuracy,
    risk,
    recommendation,
    probability_distribution,
    next_steps,
  } = req.body || {};

  if (!to) {
    return res.status(400).json({ error: 'Recipient email address required ("to" field).' });
  }

  const templatePath = path.join(__dirname, '..', 'pdf', 'template.html');
  try {
    const html = fs.readFileSync(templatePath, 'utf8');
    const riskColor = risk === 'High' ? '#e74c3c' : risk === 'Medium' ? '#f39c12' : '#27ae60';
    // render email PDF
    const rendered = ejs.render(html, {
      name,
      age,
      gender,
      contact,
      symptoms,
      prediction,
      accuracy,
      risk,
      recommendation,
      probability_distribution,
      next_steps,
      match_counts: req.body.match_counts,
      riskColor,
      diabetes_prob,
      heart_prob,
    });
    const options = { format: 'Letter' };
    pdf.create(rendered, options).toBuffer(async (err, buffer) => {
      if (err) {
        console.error('PDF buffer error', err);
        return res.status(500).send('PDF generation error');
      }

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
          subject: subject || `Health report for ${name}`,
          text: `Please find attached a health report for ${name}.`,
          attachments: [{ filename: `report-${name}.pdf`, content: buffer }],
        });
        res.json({ success: true });
      } catch (emailErr) {
        console.error('email send error', emailErr);
        res.status(500).json({ error: 'Failed to send email', details: emailErr.toString() });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Template read error');
  }
});

module.exports = router;
