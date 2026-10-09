import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicit absolute path to backend/.env
export const backendEnvPath = path.resolve(__dirname, '../.env');
export const rootEnvPath = path.resolve(__dirname, '../../.env');

let loadedPath = null;

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
  loadedPath = backendEnvPath;
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
  loadedPath = rootEnvPath;
} else {
  dotenv.config();
  loadedPath = 'default (process.cwd)';
}

/**
 * Returns safe diagnostic information about environment variable configuration
 * without exposing or printing any secret or plain values.
 */
export function getEnvDiagnostics() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  const isUserDefined = typeof user === 'string';
  const isUserNotEmpty = isUserDefined && user.trim().length > 0;
  const isUserPlaceholder = isUserNotEmpty && user.includes('your_gmail_address');
  const isUserConfigured = isUserNotEmpty && !isUserPlaceholder;

  const isPassDefined = typeof pass === 'string';
  const cleanPass = isPassDefined ? pass.trim().replace(/\s+/g, '') : '';
  const isPassNotEmpty = cleanPass.length > 0;
  const isPassPlaceholder = isPassNotEmpty && pass.includes('your_gmail_app_password');
  const isPassConfigured = isPassNotEmpty && !isPassPlaceholder;

  return {
    envFileExists: fs.existsSync(backendEnvPath),
    loadedPath,
    variables: {
      GMAIL_USER: {
        defined: isUserDefined,
        configured: isUserConfigured,
        isPlaceholder: isUserPlaceholder,
      },
      GMAIL_APP_PASSWORD: {
        defined: isPassDefined,
        configured: isPassConfigured,
        isPlaceholder: isPassPlaceholder,
        length: cleanPass.length,
        hasExpectedAppPasswordLength: cleanPass.length === 16,
      },
    },
    allConfigured: isUserConfigured && isPassConfigured,
  };
}

export default dotenv;
