import '../config/loadEnv.js';
import nodemailer from 'nodemailer';
import { getEnvDiagnostics } from '../config/loadEnv.js';

/**
 * Normalizes and extracts Gmail SMTP credentials from environment
 */
export function getGmailCredentials() {
  const user = (process.env.GMAIL_USER || '').trim();
  const rawPass = (process.env.GMAIL_APP_PASSWORD || '').trim();
  // Strip any whitespace from Google 16-character App Passwords
  const pass = rawPass.replace(/\s+/g, '');

  const diagnostics = getEnvDiagnostics();
  const isConfigured = diagnostics.allConfigured;

  return { user, pass, isConfigured, diagnostics };
}

/**
 * Creates and validates Nodemailer Gmail SMTP transporter
 * Configured according to requirements:
 * - host: smtp.gmail.com
 * - port: 465
 * - secure: true
 * - auth: user and pass
 */
export function createTransporter() {
  const { user, pass, isConfigured, diagnostics } = getGmailCredentials();

  if (!isConfigured) {
    let reason = 'Please set GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env';
    if (!diagnostics.envFileExists) {
      reason = 'backend/.env file was not found.';
    } else if (!diagnostics.variables.GMAIL_USER.configured && !diagnostics.variables.GMAIL_APP_PASSWORD.configured) {
      reason = 'Both GMAIL_USER and GMAIL_APP_PASSWORD are empty in backend/.env.';
    } else if (!diagnostics.variables.GMAIL_USER.configured) {
      reason = 'GMAIL_USER is empty or set to placeholder in backend/.env.';
    } else if (!diagnostics.variables.GMAIL_APP_PASSWORD.configured) {
      reason = 'GMAIL_APP_PASSWORD is empty or set to placeholder in backend/.env.';
    }

    throw new Error(`Gmail SMTP credentials are not configured: ${reason}`);
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Verifies the Gmail SMTP connection and authentication safely using transporter.verify().
 * Does NOT send any OTP or email.
 * Never prints or leaks secrets/passwords.
 * @returns {Promise<{ success: boolean, configured: boolean, message: string }>}
 */
export async function verifySmtpConnection() {
  const { user, isConfigured, diagnostics } = getGmailCredentials();

  if (!isConfigured) {
    return {
      success: false,
      configured: false,
      diagnostics: diagnostics.variables,
      message:
        'Gmail credentials are missing or unconfigured in backend/.env. Please enter your Gmail address in GMAIL_USER and your 16-character App Password in GMAIL_APP_PASSWORD.',
    };
  }

  try {
    const transporter = createTransporter();
    await transporter.verify();
    return {
      success: true,
      configured: true,
      diagnostics: diagnostics.variables,
      message: `Gmail SMTP server connected and authenticated successfully for: ${user}`,
    };
  } catch (error) {
    let actionableMessage = error.message;

    if (
      error.code === 'EAUTH' ||
      error.responseCode === 535 ||
      (error.message && error.message.includes('535-5.7.8')) ||
      (error.message && error.message.includes('Username and Password not accepted'))
    ) {
      actionableMessage =
        'Gmail authentication failed (535-5.7.8: Username and Password not accepted). Possible causes:\n' +
        '  1. 2-Step Verification must be enabled on your Google Account.\n' +
        '  2. You must use a 16-character App Password generated specifically for "SecureVault", NOT your personal Google account password.\n' +
        '  3. Ensure GMAIL_USER exactly matches the Google account where the App Password was created.\n' +
        '  4. Check for any typo in GMAIL_APP_PASSWORD in backend/.env.';
    }

    return {
      success: false,
      configured: true,
      diagnostics: diagnostics.variables,
      message: actionableMessage,
    };
  }
}

/**
 * Send professional branded OTP verification email via Gmail SMTP
 * @param {object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.otp - 6-digit OTP
 * @param {string} options.purpose - 'register' or 'login'
 * @param {string} options.name - Optional user name
 */
export async function sendOtpEmail({ to, otp, purpose, name = 'Valued User' }) {
  if (!to || !otp) {
    throw new Error('Recipient email and OTP are required to send verification email.');
  }

  const isRegister = purpose === 'register';
  const actionTitle = isRegister ? 'Account Registration' : 'Account Login';
  const subject = `SecureVault OTP Verification Code: ${otp}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4F6FA; margin: 0; padding: 24px 0; color: #202534;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E5E7EB; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #4F46E5; padding: 28px 32px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">
                🛡️ SecureVault
              </h1>
              <p style="color: #EEF2FF; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">
                Enterprise Zero-Knowledge Password Manager
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #202534;">
                ${actionTitle} Verification Code
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #6B7280;">
                Hello <strong>${name}</strong>,<br>
                Please use the one-time verification code (OTP) below to authorize your ${isRegister ? 'new account registration' : 'login session'}.
              </p>

              <!-- OTP Box -->
              <div style="background-color: #EEF2FF; border: 2px dashed #4F46E5; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #4F46E5; display: inline-block;">
                  ${otp}
                </span>
                <div style="margin-top: 8px; font-size: 12px; color: #4338CA; font-weight: 600;">
                  ⏱️ Valid for 5 minutes only
                </div>
              </div>

              <!-- Security details -->
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #6B7280; line-height: 1.5;">
                • Never share this code with anyone. SecureVault staff will never ask for your OTP.<br>
                • You have up to 5 attempts to enter this code before it is permanently invalidated.
              </p>

              <p style="margin: 0; font-size: 12px; color: #9CA3AF; line-height: 1.4; border-top: 1px solid #E5E7EB; padding-top: 16px;">
                If you did not initiate this request, someone may be attempting to access your vault. Please review your master password and account security immediately.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 16px 32px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                SecureVault Cryptographic Security System • Automated Message
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const transporter = createTransporter();

  const { user } = getGmailCredentials();
  const mailOptions = {
    from: `"SecureVault Security" <${user}>`,
    to,
    subject,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send email to ${to}:`, error.message);
    let detailedMsg = error.message;
    if (
      error.code === 'EAUTH' ||
      error.responseCode === 535 ||
      (error.message && error.message.includes('535-5.7.8')) ||
      (error.message && error.message.includes('Username and Password not accepted'))
    ) {
      detailedMsg =
        'Gmail authentication failed (535-5.7.8: Username and Password not accepted). Please ensure: 1) 2-Step Verification is enabled on your Google Account. 2) You generated a 16-character App Password for "SecureVault". 3) GMAIL_APP_PASSWORD contains that 16-character code (not your regular password). 4) GMAIL_USER matches the exact Gmail address in backend/.env.';
    }
    throw new Error(`Email delivery failed via Gmail SMTP: ${detailedMsg}`);
  }
}
