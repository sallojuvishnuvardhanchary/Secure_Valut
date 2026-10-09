# SecureVault — MERN Secure Password Manager

[![Security: AES-256-GCM](https://img.shields.io/badge/Security-AES--256--GCM-indigo.svg)](https://csrc.nist.gov/publications/detail/sp/800-38d/final)
[![Authentication: JWT & Bcrypt](https://img.shields.io/badge/Auth-JWT%20%2B%20Bcrypt-4F46E5.svg)](https://jwt.io/)
[![Stack: MERN](https://img.shields.io/badge/Stack-MongoDB%20%7C%20Express%20%7C%20React%20%7C%20Node-success.svg)](https://nodejs.org/)

SecureVault is an enterprise-grade, responsive, full-stack Secure Password Manager built with the **MERN** stack (MongoDB, Express.js, React.js with Vite, and Node.js). It provides zero-knowledge authenticated encryption, multi-tenant cryptographic isolation, real-time password generator with Web Crypto API, a proactive Security Center audit, and an intuitive SaaS dashboard with Light and Dark modes.

---

## Table of Contents
1. [Core Features](#core-features)
2. [Cryptographic Architecture & Key Management](#cryptographic-architecture--key-management)
3. [Technology Stack](#technology-stack)
4. [Color Palette & Theme Specifications](#color-palette--theme-specifications)
5. [Project Structure](#project-structure)
6. [Prerequisites](#prerequisites)
7. [Installation & Setup](#installation--setup)
8. [Running the Application](#running-the-application)
9. [Fictional Demo Credentials](#fictional-demo-credentials)
10. [REST API Documentation](#rest-api-documentation)
11. [Running Tests](#running-tests)
12. [Production Security Best Practices](#production-security-best-practices)

---

## Core Features

- 🔐 **Zero-Plaintext Storage**: All saved website credentials are encrypted with **AES-256-GCM** (Galois/Counter Mode). Passwords are never logged, stored in plaintext, or exposed in localStorage.
- 🛡️ **Cryptographic Tenant Isolation**: Encryption keys are derived per user using **HKDF-SHA256**. Even with server access, credentials belonging to User A cannot be decrypted with User B's derived key.
- 📧 **Gmail Two-Step OTP Verification**: Real-time 6-digit OTP delivery via Gmail SMTP (Nodemailer) for both new registration and existing user login. Cryptographically secure random generation, 5-minute auto-expiry, HMAC-SHA256 hashed storage, 5-attempt brute-force threshold, 60-second cooldown timer, previous OTP invalidation, and zero JWT issuance before successful verification.
- 🗂️ **4 Professional View Modes**: Windows File Explorer-inspired segmented toolbar on the All Passwords page featuring **Large Cards** (3-column responsive grid), **Small Cards** (compact grid with high item density), **List View** (horizontal rows with quick actions), and **Table View** (structured columns), persisted via `localStorage`.
- 🔍 **Privacy-Preserving Password Reuse Audit**: Uses blinded **HMAC-SHA256** fingerprints so the Security Center detects reused passwords across accounts without decrypting them or storing plaintext comparisons.
- 🎲 **Web Crypto API Password Generator**: Browser-side cryptographically secure random password generation (`window.crypto.getRandomValues`) with custom length (8–48 chars), uppercase, lowercase, numbers, and symbols.
- 📊 **Dynamic SaaS Dashboard**: Summary statistic cards calculated in real-time from user data (Total Passwords, Category counts, Favorites, Security Reminders).
- 🌓 **Zero-Flash Light/Dark Mode**: High-contrast, theme persistent via `localStorage` and early-executed head script, conforming to strict color requirements.
- ⚡ **Complete CRUD Operations**: Add, view, edit, search, favorite, copy, and delete credentials with confirmation dialogs.
- 👁️ **Independent Show/Hide State**: Passwords are masked with dots (`••••••••••••`) by default. Decrypted plaintext is fetched on-demand with authorized tokens only when the user explicitly clicks reveal or copy.
- 📱 **Fully Responsive Layout**: Adaptive sidebar navigation drawer on mobile and collapsible drawer for smaller screens; clean table on desktop and touch-friendly cards on mobile.

---

## Cryptographic Architecture & Key Management

### 1. Authenticated Encryption with AES-256-GCM
Symmetric encryption alone (such as AES-CBC without HMAC) is vulnerable to bit-flipping and padding-oracle attacks. SecureVault utilizes **AES-256-GCM**:
- **Cipher**: AES with 256-bit key length.
- **IV (Initialization Vector)**: 12-byte (96-bit) cryptographically random IV generated via `crypto.randomBytes(12)` per encryption. IV is never reused.
- **Authentication Tag**: 16-byte (128-bit) GCM auth tag generated via `cipher.getAuthTag()`. The tag verifies both data confidentiality and authenticity before any plaintext is returned.

### 2. Tenant Isolation via HKDF-SHA256
Rather than using a single static key to encrypt all records:
```
User-Derived Key = HKDF-SHA256(
    IKM = Master Server Key,
    Salt = User ID,
    Info = "SecureVault-User-Credential-Key-v1",
    Length = 32 bytes
)
```
This ensures cryptographic separation between users. Even if the database ciphertext is intercepted, individual records cannot be cross-decrypted.

### 3. Blinded HMAC-SHA256 Fingerprints for Reuse Detection
Detecting whether a user has reused the same password across multiple accounts typically requires either storing plaintext hashes (which leaks passwords to dictionary attacks) or decrypting all records on every audit. SecureVault generates a blinded fingerprint:
```
Password Fingerprint = HMAC-SHA256(Key = User-Derived Key, Data = Plaintext Password)
```
This enables the Security Center to aggregate identical passwords via MongoDB aggregation pipelines without exposing the password or matching across different users.

### 4. Key Management Strategy & Limitations
- **Server-Side Key Limitation**: Storing the master key in server environment variables means a root server compromise could potentially yield the key. In enterprise production, this master key is integrated with hardware security modules (AWS KMS, Google Cloud KMS, or HashiCorp Vault) or derived client-side from the master password (zero-knowledge client architecture like 1Password/Bitwarden).
- **Separation of Concerns**: The master encryption key is **never** stored in MongoDB alongside encrypted records. It is loaded exclusively via environment variables (`ENCRYPTION_KEY`).

---

## Technology Stack

### Frontend
- **React.js 18** with **Vite** (Fast HMR, optimized production chunks)
- **React Router DOM v6** (Protected and public routing)
- **Axios** (Configured with credentials and token interceptors)
- **Lucide React** (Modern iconography)
- **Custom CSS** with CSS Custom Properties (Theme tokens, responsive breakpoints, smooth transitions)

### Backend
- **Node.js** (v20+ / v24+)
- **Express.js** (Modular REST API architecture)
- **MongoDB** / **MongoDB Atlas** with **Mongoose**
- **JSON Web Tokens (JWT)** & **HTTP-Only Cookies**
- **Nodemailer** (Gmail SMTP transport for two-step email verification)
- **bcryptjs** (Master password hashing with 12 salt rounds)
- **Node.js `crypto`** (AES-256-GCM, HKDF, timingSafeEqual & randomInt OTP)
- **Helmet** (HTTP security headers)
- **express-rate-limit** (Brute-force protection on auth endpoints)
- **CORS** (Whitelisted origin configuration with credentials)

---

## Color Palette & Theme Specifications

| Element | Light Mode (`[data-theme="light"]`) | Dark Mode (`[data-theme="dark"]`) |
| :--- | :--- | :--- |
| **Page background** | `#F4F6FA` | `#171923` |
| **Cards and panels** | `#FFFFFF` | `#232635` |
| **Primary text** | `#202534` | `#F3F4F6` |
| **Secondary text** | `#6B7280` | `#A1A6B8` |
| **Borders** | `#E5E7EB` | `#35394A` |
| **Accent / Focus** | `#4F46E5` (Indigo) | `#A5B4FC` (Light Indigo) |
| **Input fields** | `#FFFFFF` | `#1D2130` |

---

## Project Structure

```text
Secure_Password_Manager/Program_files/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & configuration
│   ├── controllers/
│   │   ├── authController.js       # Register, login, OTP challenges, me, logout
│   │   ├── credentialController.js # Full CRUD, stats, security audit
│   │   └── userController.js       # Profile & master password updates
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT validation & user attachment
│   │   ├── errorMiddleware.js      # Centralized error handling
│   │   └── rateLimiter.js          # IP rate limiters for auth & API
│   ├── models/
│   │   ├── User.js                 # User schema with bcrypt pre-save hook
│   │   ├── Credential.js           # Encrypted credential schema & indexes
│   │   └── OtpChallenge.js         # Ephemeral OTP challenges with TTL & attempt limits
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth routes (including OTP endpoints)
│   │   ├── credentialRoutes.js     # /api/credentials routes
│   │   └── userRoutes.js           # /api/users routes
│   ├── services/
│   │   ├── cryptoService.js        # AES-256-GCM & HKDF key derivation
│   │   └── emailService.js         # Nodemailer Gmail SMTP sender & branded template
│   ├── utils/
│   │   ├── jwt.js                  # Token generation & verification
│   │   ├── otpUtils.js             # Crypto random OTP, HMAC-SHA256 & timingSafeEqual
│   │   ├── passwordStrength.js     # NIST complexity evaluation
│   │   ├── seedData.js             # Fictional demo dataset seeder
│   │   └── testSuite.js            # Automated backend security test suite (8 suites)
│   ├── server.js                   # Express application entrypoint
│   ├── .env.example                # Template for environment configuration
│   ├── .env                        # Local environment configuration
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── shield.svg              # Favicon branding
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfirmDialog.jsx   # Deletion confirmation modal
│   │   │   ├── Navbar.jsx          # Top navbar, global search, user menu
│   │   │   ├── PasswordCard.jsx    # Responsive card view for mobile/grid
│   │   │   ├── PasswordForm.jsx    # Add & Edit credential modal form
│   │   │   ├── PasswordGenerator.jsx # Interactive Web Crypto generator
│   │   │   ├── PasswordTable.jsx   # Desktop table view with masked passwords
│   │   │   ├── Sidebar.jsx         # Responsive sidebar & mobile drawer
│   │   │   ├── StatCard.jsx        # Summary metric card
│   │   │   ├── ThemeToggle.jsx     # Sun/Moon theme toggle
│   │   │   └── ViewOptionsToolbar.jsx # Segmented control for 4 view modes
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # Authentication state, OTP verification & actions
│   │   │   ├── CredentialContext.jsx # Vault state, CRUD, & decryption
│   │   │   ├── ThemeContext.jsx    # Theme switcher & persistence
│   │   │   └── ToastContext.jsx    # Animated notification system
│   │   ├── pages/
│   │   │   ├── AllPasswords.jsx    # Full credentials view with 4 view modes & filters
│   │   │   ├── Categories.jsx      # Categorized credential explorer
│   │   │   ├── Dashboard.jsx       # Overview, metrics & recent credentials
│   │   │   ├── Favorites.jsx       # Pinned credentials
│   │   │   ├── Login.jsx           # Login page with demo autofill & OTP routing
│   │   │   ├── Register.jsx        # Registration with live strength check & OTP routing
│   │   │   ├── VerifyOtp.jsx       # 6-digit segmented OTP verification & cooldown timer
│   │   │   ├── SecurityCenter.jsx  # Health audit, weak/reused alerts
│   │   │   └── Settings.jsx        # Profile, master password & preferences
│   │   ├── services/
│   │   │   └── api.js              # Axios instance with interceptors & OTP methods
│   │   ├── styles/
│   │   │   ├── global.css          # Layout, utilities, & components
│   │   │   └── themes.css          # Light/Dark mode CSS variables
│   │   ├── utils/
│   │   │   └── cryptoGenerator.js  # Web Crypto API utilities
│   │   ├── App.jsx                 # Route configurations & layout guards
│   │   └── main.jsx                # Application root mounting
│   ├── index.html                  # HTML entrypoint with flash prevention
│   ├── vite.config.js              # Vite server & proxy configuration
│   └── package.json
│
├── .gitignore
├── package.json                    # Root workspace orchestration
└── README.md
```

---

## Prerequisites

1. **Node.js**: Version 18.x, 20.x, or 24.x
2. **npm**: Version 9.x or higher
3. **MongoDB**: Local MongoDB Server (running on port 27017) or a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster connection URI.

---

## Installation & Setup

Open PowerShell or Command Prompt in the project directory:
```powershell
cd c:\Users\vishn\OneDrive\Desktop\Anti_Gravi\Secure_Password_Manager\Program_files
```

### 1. Install All Dependencies
Run the root script to install both backend and frontend dependencies:
```powershell
npm run install:all
```
*(Or install manually in each directory: `cd backend && npm install`, then `cd ../frontend && npm install`)*

### 2. Configure Environment Variables
A template `.env.example` is located in `backend/.env.example`. A ready configured `.env` file is in `backend/.env`. Update the fields for your environment or Gmail credentials:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/securevault
JWT_SECRET=securevault_jwt_super_secret_production_ready_key_987654321
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=a7e96fbe2c6ca6508dc1ec0fb8060c5a8f7a2ce2ddad9710c9643dc354146ccc

# Gmail SMTP Configuration for OTP Verification
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password
```

> **Generating a new Master Encryption Key:**
> Run in terminal:
> ```powershell
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

> ### 📧 How to Obtain a Gmail App Password:
> SecureVault uses Nodemailer with Gmail SMTP to deliver one-time verification codes (OTPs):
> 1. Open your [Google Account](https://myaccount.google.com/) and navigate to **Security**.
> 2. Ensure **2-Step Verification** is turned **ON**.
> 3. In the search bar at the top or under "2-Step Verification", select **App passwords**.
> 4. Enter `SecureVault` as the app name and click **Create**.
> 5. Google will display a **16-character password** (e.g. `abcd efgh ijkl mnop`).
> 6. Copy this password into `backend/.env` as `GMAIL_APP_PASSWORD` (spaces are automatically stripped by the backend).
> 7. Set your Gmail address as `GMAIL_USER`.
>
> ### 🔍 Verifying Gmail SMTP Configuration:
> Test your SMTP authentication without sending any OTP email:
> ```powershell
> npm run test:smtp
> ```
> This command verifies the connection to `smtp.gmail.com:465` using `transporter.verify()`. It safely prints the connection status without logging secrets or passwords.

### 3. Seed Demo Data (Optional)
Populate the database with fictional credentials for testing:
```powershell
npm run seed
```

---

## Running the Application

### Option A: Run with two terminal windows (Recommended for development)

**Terminal 1 (Backend Server):**
```powershell
cd backend
npm run dev
```
*Backend will start on `http://localhost:5000`.*

**Terminal 2 (Frontend Client):**
```powershell
cd frontend
npm run dev
```
*Frontend will start on `http://localhost:5173`.*

---

### Option B: Quick Root Commands
From the project root:
- Start backend: `npm run start:backend`
- Start frontend dev: `npm run dev:frontend`
- Build frontend for production: `npm run build:frontend`

---

## Fictional Demo Credentials

For quick evaluation, click the **"Fill Demo Credentials"** button on the Login page, or enter:

- **Email**: `demo@securevault.com`
- **Master Password**: `Password@1234`

### Included Demo Records:
| Service | Username | Category | Initial Strength | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **GitHub Enterprise** | `alex.developer@example.com` | Development | Strong | Work / Code repository |
| **Figma Cloud** | `alex.designer@example.com` | Work | Strong | UI/UX Wireframes |
| **Chase Banking** | `alex_investor` | Banking | Strong | Financial portal |
| **Coursera** | `alex.student@example.com` | Education | Weak (`Password123`) | Trigger weak password alert |
| **Spotify Music** | `alex.tunes@example.com` | Other | Weak (`Password123`) | Trigger reuse group alert |
| **AWS Cloud** | `cloud.admin@example.com` | Development | Strong | Infrastructure |
| **Shopify Store** | `alex.store@example.com` | Shopping | Strong | E-commerce store |
| **Twitter / X** | `alex_codes_tech` | Social Media | Strong | Social handle |

---

## REST API Documentation

All `/api/credentials` and `/api/users` endpoints require `Authorization: Bearer <token>` or HTTP-only session cookie.

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Validate inputs & send 6-digit registration OTP via Gmail | `{ name, email, password, confirmPassword }` |
| `POST` | `/api/auth/verify-register-otp` | Verify registration OTP, create & activate user in MongoDB | `{ email, otp }` |
| `POST` | `/api/auth/login` | Validate password & send 6-digit login OTP via Gmail | `{ email, password }` |
| `POST` | `/api/auth/verify-login-otp` | Verify login OTP & issue JWT session | `{ email, otp }` |
| `POST` | `/api/auth/resend-otp` | Resend fresh OTP (60s cooldown limit, invalidates previous OTP) | `{ email, purpose }` |
| `GET` | `/api/auth/me` | Fetch authenticated profile | *None* |
| `POST` | `/api/auth/logout` | Clear cookie session | *None* |

### Credential Endpoints (`/api/credentials`)
| Method | Endpoint | Description | Request Body / Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/credentials` | List all credentials (masked) | Query: `?search=&category=&favorite=&sort=` |
| `POST` | `/api/credentials` | Create encrypted credential | `{ websiteName, websiteUrl, username, password, category, notes, isFavorite }` |
| `GET` | `/api/credentials/:id` | Fetch credential with decrypted password | *None* |
| `PATCH` | `/api/credentials/:id` | Update credential fields | `{ websiteName, websiteUrl, username, password, category, notes, isFavorite }` |
| `PATCH` | `/api/credentials/:id/favorite` | Toggle favorite status | *None* |
| `DELETE` | `/api/credentials/:id` | Delete credential permanently | *None* |
| `GET` | `/api/credentials/stats` | Aggregated dashboard stats | *None* |
| `GET` | `/api/credentials/security-analysis` | Security Center audit analysis | *None* |

### User Settings Endpoints (`/api/users`)
| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `PATCH` | `/api/users/profile` | Update user name & preferences | `{ name, preferences: { theme, defaultView } }` |
| `PATCH` | `/api/users/change-password` | Update master login password | `{ currentPassword, newPassword, confirmNewPassword }` |

---

## Running Tests

An automated cryptographic and multi-tenant security verification test suite (8 comprehensive suites) is included:
```powershell
npm run test:backend
```

### Verified Test Assertions (8 Suites):
1. **AES-256-GCM Authenticated Encryption**: Verifies encryption produces ciphertext, 12-byte IV, 16-byte auth tag, and round-trips to the original plaintext.
2. **Cryptographic Multi-User Tenant Isolation**: Confirms User B's key cannot decrypt User A's ciphertext (throws GCM tag validation failure).
3. **Ciphertext Tampering Detection**: Confirms tampered ciphertext is rejected by the GCM authentication tag.
4. **Password Strength Evaluator**: Confirms weak dictionary patterns vs complex entropies are properly scored against NIST guidelines.
5. **Database Ownership Verification**: Verifies MongoDB queries strictly scope queries to `userId`, preventing cross-account access.
6. **Secure 6-Digit OTP Generation & HMAC-SHA256 Hashing**: Confirms random generation (`crypto.randomInt`), HMAC-SHA256 hashing, and non-plaintext storage.
7. **Timing-Safe OTP Verification**: Confirms timing-safe equality verification (`crypto.timingSafeEqual`) rejects wrong OTPs and matches valid ones.
8. **OTP Expiration, Invalidation & Attempt Limits**: Confirms past-expiration rejection, single-use invalidation (preventing replay attacks), and challenge cancellation after 5 failed attempts.

---

## Production Security Best Practices

When deploying SecureVault to a production cloud environment:
1. **SSL/TLS**: Always serve backend and frontend exclusively over HTTPS with HTTP Strict Transport Security (HSTS).
2. **KMS Key Management**: In cloud providers (AWS, Azure, GCP), load `ENCRYPTION_KEY` from KMS or a secret manager with IAM role restrictions rather than plain disk files.
3. **Database Network Peering**: Restrict MongoDB Atlas network access to your backend cluster's private VPC IP addresses.
4. **Cookie Protections**: Ensure cookies use `secure: true`, `httpOnly: true`, and `sameSite: 'strict'`.
5. **Session Inactivity Timeouts**: Enforce auto-lock after 15 minutes of user inactivity to clear in-memory decrypted passwords.
