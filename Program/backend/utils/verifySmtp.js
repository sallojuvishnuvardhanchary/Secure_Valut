import '../config/loadEnv.js';
import { getEnvDiagnostics } from '../config/loadEnv.js';
import { verifySmtpConnection, getGmailCredentials } from '../services/emailService.js';

async function main() {
  console.log('\n======================================================');
  console.log('   SECUREVAULT GMAIL SMTP CONFIGURATION VERIFIER');
  console.log('======================================================\n');

  const diag = getEnvDiagnostics();
  const { user, isConfigured } = getGmailCredentials();

  console.log(`[Diagnostic] .env file location:  ${diag.loadedPath}`);
  console.log(`[Diagnostic] .env file exists:    ${diag.envFileExists ? 'YES' : 'NO'}`);
  console.log(
    `[Diagnostic] GMAIL_USER:          ${
      diag.variables.GMAIL_USER.configured
        ? 'Configured (Valid format)'
        : diag.variables.GMAIL_USER.defined && !diag.variables.GMAIL_USER.isPlaceholder
        ? 'Empty / Undefined'
        : 'Placeholder (needs real email)'
    }`
  );
  console.log(
    `[Diagnostic] GMAIL_APP_PASSWORD:  ${
      diag.variables.GMAIL_APP_PASSWORD.configured
        ? `Configured (${diag.variables.GMAIL_APP_PASSWORD.length} chars, expected 16)`
        : diag.variables.GMAIL_APP_PASSWORD.defined && !diag.variables.GMAIL_APP_PASSWORD.isPlaceholder
        ? 'Empty / Undefined'
        : 'Placeholder (needs real App Password)'
    }`
  );
  console.log('------------------------------------------------------');
  console.log('Target SMTP Server: smtp.gmail.com');
  console.log('Target SMTP Port:   465 (SSL / Secure: true)\n');

  if (!isConfigured) {
    console.log('⚠️  STATUS: Credentials NOT Fully Configured');
    console.log('------------------------------------------------------');
    console.log('Please open backend/.env and configure:');
    console.log('  GMAIL_USER=your_email@gmail.com');
    console.log('  GMAIL_APP_PASSWORD=your_16_char_app_password');
    console.log('\nImportant:');
    console.log('  - Do NOT use your normal Google account password.');
    console.log('  - Generate a 16-character App Password at:');
    console.log('    https://myaccount.google.com/apppasswords\n');
    process.exit(1);
  }

  // Obfuscate the email address for safe display (e.g. j***e@gmail.com)
  const parts = user.split('@');
  const maskedUser =
    parts.length === 2 && parts[0].length > 2
      ? `${parts[0][0]}***${parts[0].slice(-1)}@${parts[1]}`
      : user;

  console.log(`Configured Account: ${maskedUser}`);
  console.log('Testing SMTP connection & authentication with Google servers...\n');

  const result = await verifySmtpConnection();

  if (result.success) {
    console.log('✅ SUCCESS: Gmail SMTP credentials verified!');
    console.log(`   ${result.message}`);
    console.log('\nYour backend is ready to deliver 6-digit SecureVault OTPs via Gmail.\n');
    process.exit(0);
  } else {
    console.error('❌ FAILED: SMTP Verification could not complete.');
    console.error('------------------------------------------------------');
    console.error(result.message);
    console.error('\nTips to resolve 535-5.7.8 Username and Password not accepted:');
    console.error('  1. Go to https://myaccount.google.com/security');
    console.error('  2. Confirm "2-Step Verification" is ON.');
    console.error('  3. Select "App passwords" and generate an app password named "SecureVault".');
    console.error('  4. Copy the 16 characters and paste into GMAIL_APP_PASSWORD in backend/.env.');
    console.error('  5. Ensure GMAIL_USER matches the Google account you created the app password under.\n');
    process.exit(1);
  }
}

main();
