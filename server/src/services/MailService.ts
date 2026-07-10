import nodemailer from 'nodemailer';
import AuditLog from '../models/AuditLog';
import User from '../models/User';

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

  const isSmtpConfigured = !!(host && port && user && pass);

  if (isSmtpConfigured) {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      auth: { user, pass }
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"SakhiCredit" <no-reply@sakhicredit.com>',
      to: email,
      subject: 'Verify Your Email - SakhiCredit',
      html: `<p>Please verify your email by clicking the link below:</p><a href="${link}">${link}</a>`
    });
  } else {
    console.log(`\n==================================================\n[TESTING] Email Verification Link for ${email}:\n${link}\n==================================================\n`);
    
    // Find user to associate with AuditLog if exists
    const dbUser = await User.findOne({ email: email.toLowerCase() });
    const userId = dbUser ? dbUser._id.toString() : undefined;

    await AuditLog.create({
      action: 'EMAIL_VERIFICATION_LINK',
      details: { email, token, verificationLink: link },
      userId
    });
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

  const isSmtpConfigured = !!(host && port && user && pass);

  if (isSmtpConfigured) {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      auth: { user, pass }
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"SakhiCredit" <no-reply@sakhicredit.com>',
      to: email,
      subject: 'Reset Password - SakhiCredit',
      html: `<p>Reset your password by clicking the link below:</p><a href="${link}">${link}</a>`
    });
  } else {
    console.log(`\n==================================================\n[TESTING] Password Reset Link for ${email}:\n${link}\n==================================================\n`);
    
    // Find user to associate with AuditLog if exists
    const dbUser = await User.findOne({ email: email.toLowerCase() });
    const userId = dbUser ? dbUser._id.toString() : undefined;

    await AuditLog.create({
      action: 'PASSWORD_RESET_LINK',
      details: { email, token, resetLink: link },
      userId
    });
  }
}
