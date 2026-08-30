const EmailFactory = require('../factory/EmailFactory');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendMail = function ({ to, subject, html }) {
  const correctHtml = EmailFactory.generate(html, subject);
  const msg = {
    from: `"${process.env.MAIL_APP_NAME}" <${process.env.MAIL_FROM}>`,
    to,
    subject,
    text: html,
    html: correctHtml,
  };

  return transporter.sendMail(msg)
    .then(() => { console.log('  - Email sent to', to); })
    .catch(_err => { console.error('  ! Error sending email to', to, _err); });
};

const sendVerifyEmailMail = function ({ to, token }) {
  const link = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  const html = `
    <h1>Thanks for signin up to AudioLibrary!</h1>
    <h2>Confirm this is you by verifying your email address</h2>
    <a href="${link}">Click here to activate your account</a>
    <p>Or copy this into your browser:</p>
    <p>${link}</p>
  `;
  return sendMail({ to, html, subject: 'AudioLibrary | Verify your email address' });
};

module.exports = {
  sendMail,
  sendVerifyEmailMail
};
