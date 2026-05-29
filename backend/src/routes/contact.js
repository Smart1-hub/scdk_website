const express    = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

// Validation
function validateContact(body) {
  const errors = [];
  if (!body.firstName?.trim())          errors.push('"firstName" is required.');
  if (!body.email?.trim())              errors.push('"email" is required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email || '')) errors.push('"email" must be valid.');
  if (!body.message?.trim())            errors.push('"message" is required.');
  if (body.message?.length > 2000)      errors.push('"message" must be under 2000 chars.');
  return errors;
}

// POST /api/contact
router.post('/', async (req, res) => {
  const errors = validateContact(req.body);
  if (errors.length) return res.status(400).json({ success: false, errors });

  const { firstName, lastName, email, organization, message } = req.body;
  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from:    `"SCDK Website" <${process.env.SMTP_USER}>`,
        to:      process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER,
        replyTo: email,
        subject: `New enquiry from ${fullName}`,
        html: `<h2>New Contact Submission</h2>
          <p><b>Name:</b> ${fullName}</p>
          <p><b>Email:</b> ${email}</p>
          <p><b>Organization:</b> ${organization || '—'}</p>
          <p><b>Message:</b><br/>${message.replace(/\n/g, '<br/>')}</p>`,
      });
    } else {
      console.log('[Contact Form]', { fullName, email, organization, message });
    }
    res.json({ success: true, message: 'Message received. We will be in touch soon.' });
  } catch (err) {
    console.error('[Contact] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
});

module.exports = router;
