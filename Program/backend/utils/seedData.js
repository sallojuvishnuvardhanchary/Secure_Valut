import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import { User } from '../models/User.js';
import { Credential } from '../models/Credential.js';
import { encryptPassword, createPasswordFingerprint } from '../services/cryptoService.js';
import { evaluatePasswordStrength } from '../utils/passwordStrength.js';

const sampleCredentials = [
  {
    websiteName: 'GitHub Enterprise',
    websiteUrl: 'https://github.com',
    username: 'alex.developer@example.com',
    password: 'ghp_K8#v9Lp$2mQx7Wz1@99',
    category: 'Development',
    notes: 'Primary 2FA developer account with SSH keys linked.',
    isFavorite: true,
  },
  {
    websiteName: 'Figma Cloud',
    websiteUrl: 'https://figma.com',
    username: 'alex.designer@example.com',
    password: 'Fig#Pro982!Design2026',
    category: 'Work',
    notes: 'Team design space for UI/UX wireframes.',
    isFavorite: true,
  },
  {
    websiteName: 'Amazon Web Services',
    websiteUrl: 'https://aws.amazon.com',
    username: 'cloud.admin@example.com',
    password: 'Aws!Secure#9948#ProdKey',
    category: 'Development',
    notes: 'Root account access with hardware MFA.',
    isFavorite: false,
  },
  {
    websiteName: 'Coursera Learning',
    websiteUrl: 'https://coursera.org',
    username: 'alex.student@example.com',
    password: 'Password123', // Deliberately weak for security center test
    category: 'Education',
    notes: 'Online courses on distributed cryptography.',
    isFavorite: false,
  },
  {
    websiteName: 'Spotify Music',
    websiteUrl: 'https://spotify.com',
    username: 'alex.tunes@example.com',
    password: 'Password123', // Deliberately reused for security center test
    category: 'Other',
    notes: 'Family premium plan account.',
    isFavorite: false,
  },
  {
    websiteName: 'Chase Banking',
    websiteUrl: 'https://chase.com',
    username: 'alex_investor',
    password: 'Ch@se!Vau1t#2026$Shield',
    category: 'Banking',
    notes: 'Primary checking and savings account portal.',
    isFavorite: true,
  },
  {
    websiteName: 'Twitter / X',
    websiteUrl: 'https://x.com',
    username: 'alex_codes_tech',
    password: 'Twitter#Shield991!',
    category: 'Social Media',
    notes: 'Social media handle for tech discussions.',
    isFavorite: false,
  },
  {
    websiteName: 'Shopify Store',
    websiteUrl: 'https://shopify.com',
    username: 'alex.store@example.com',
    password: 'Shop#Secure987!',
    category: 'Shopping',
    notes: 'E-commerce merchant dashboard.',
    isFavorite: false,
  },
];

export async function seedDemoData() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/securevault';
    await mongoose.connect(uri);
    console.log('[Seed] Connected to database for seeding...');

    // Find or create demo user
    const demoEmail = 'demo@securevault.com';
    let demoUser = await User.findOne({ email: demoEmail });

    if (!demoUser) {
      demoUser = await User.create({
        name: 'Alex Vance',
        email: demoEmail,
        password: 'Password@1234', // Demo password
      });
      console.log(`[Seed] Created demo user: ${demoEmail} (Password: Password@1234)`);
    } else {
      console.log(`[Seed] Demo user already exists: ${demoEmail}`);
    }

    // Clean existing credentials for demo user
    await Credential.deleteMany({ userId: demoUser._id });

    // Seed credentials
    for (const item of sampleCredentials) {
      const strength = evaluatePasswordStrength(item.password);
      const { encryptedPassword, iv, authTag } = encryptPassword(item.password, demoUser._id.toString());
      const passwordFingerprint = createPasswordFingerprint(item.password, demoUser._id.toString());

      await Credential.create({
        userId: demoUser._id,
        websiteName: item.websiteName,
        websiteUrl: item.websiteUrl,
        username: item.username,
        encryptedPassword,
        iv,
        authTag,
        passwordFingerprint,
        category: item.category,
        notes: item.notes,
        isFavorite: item.isFavorite,
        passwordStrength: {
          score: strength.score,
          label: strength.label,
        },
      });
    }

    console.log(`[Seed] Successfully seeded ${sampleCredentials.length} fictional credentials.`);
    await mongoose.disconnect();
    console.log('[Seed] Database disconnected.');
  } catch (error) {
    console.error('[Seed Error]:', error);
  }
}

// Allow direct CLI execution: node utils/seedData.js
if (process.argv[1].endsWith('seedData.js')) {
  seedDemoData();
}
