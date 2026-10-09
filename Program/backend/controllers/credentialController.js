import { Credential, CATEGORIES } from '../models/Credential.js';
import {
  encryptPassword,
  decryptPassword,
  createPasswordFingerprint,
} from '../services/cryptoService.js';
import { evaluatePasswordStrength } from '../utils/passwordStrength.js';

/**
 * Get all credentials for authenticated user with search, filtering, and sorting
 * GET /api/credentials
 */
export async function getCredentials(req, res, next) {
  try {
    const userId = req.user._id;
    const { search, category, favorite, sort } = req.query;

    const query = { userId };

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Favorites filter
    if (favorite === 'true' || favorite === true) {
      query.isFavorite = true;
    }

    // Search filter across website name, url, username
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { websiteName: searchRegex },
        { websiteUrl: searchRegex },
        { username: searchRegex },
      ];
    }

    // Sorting
    let sortOptions = { createdAt: -1 }; // default newest first
    if (sort === 'name_asc') {
      sortOptions = { websiteName: 1 };
    } else if (sort === 'name_desc') {
      sortOptions = { websiteName: -1 };
    } else if (sort === 'date_asc') {
      sortOptions = { createdAt: 1 };
    } else if (sort === 'date_desc') {
      sortOptions = { createdAt: -1 };
    }

    // Exclude raw ciphertext and cryptographic secrets from general listing
    const credentials = await Credential.find(query)
      .select('-encryptedPassword -iv -authTag -passwordFingerprint')
      .sort(sortOptions);

    return res.status(200).json({
      success: true,
      count: credentials.length,
      credentials,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single credential by ID with decrypted password
 * GET /api/credentials/:id
 */
export async function getCredentialById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const credential = await Credential.findOne({ _id: id, userId });
    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential record not found or access denied.',
      });
    }

    // Decrypt the password on-demand for authorized view/edit
    let decryptedPassword = '';
    try {
      decryptedPassword = decryptPassword(
        credential.encryptedPassword,
        credential.iv,
        credential.authTag,
        userId.toString()
      );
    } catch (decryptErr) {
      return res.status(500).json({
        success: false,
        message: 'Failed to decrypt credential. Cryptographic integrity check failed.',
      });
    }

    return res.status(200).json({
      success: true,
      credential: {
        _id: credential._id,
        websiteName: credential.websiteName,
        websiteUrl: credential.websiteUrl,
        username: credential.username,
        password: decryptedPassword, // Decrypted only for authorized requester
        category: credential.category,
        notes: credential.notes,
        isFavorite: credential.isFavorite,
        passwordStrength: credential.passwordStrength,
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new credential
 * POST /api/credentials
 */
export async function createCredential(req, res, next) {
  try {
    const userId = req.user._id;
    const { websiteName, websiteUrl, username, password, category, notes, isFavorite } = req.body;

    if (!websiteName || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Website name, username/email, and password are required.',
      });
    }

    // Evaluate password strength
    const strength = evaluatePasswordStrength(password);

    // Encrypt password using AES-256-GCM
    const { encryptedPassword, iv, authTag } = encryptPassword(password, userId.toString());

    // Generate blinded HMAC fingerprint for reuse detection
    const passwordFingerprint = createPasswordFingerprint(password, userId.toString());

    const newCredential = await Credential.create({
      userId,
      websiteName: websiteName.trim(),
      websiteUrl: (websiteUrl || '').trim(),
      username: username.trim(),
      encryptedPassword,
      iv,
      authTag,
      passwordFingerprint,
      category: CATEGORIES.includes(category) ? category : 'Other',
      notes: notes || '',
      isFavorite: Boolean(isFavorite),
      passwordStrength: {
        score: strength.score,
        label: strength.label,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Credential securely saved.',
      credential: {
        _id: newCredential._id,
        websiteName: newCredential.websiteName,
        websiteUrl: newCredential.websiteUrl,
        username: newCredential.username,
        category: newCredential.category,
        notes: newCredential.notes,
        isFavorite: newCredential.isFavorite,
        passwordStrength: newCredential.passwordStrength,
        createdAt: newCredential.createdAt,
        updatedAt: newCredential.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing credential
 * PATCH /api/credentials/:id
 */
export async function updateCredential(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { websiteName, websiteUrl, username, password, category, notes, isFavorite } = req.body;

    const credential = await Credential.findOne({ _id: id, userId });
    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential record not found or access denied.',
      });
    }

    if (websiteName) credential.websiteName = websiteName.trim();
    if (websiteUrl !== undefined) credential.websiteUrl = (websiteUrl || '').trim();
    if (username) credential.username = username.trim();
    if (category && CATEGORIES.includes(category)) credential.category = category;
    if (notes !== undefined) credential.notes = notes;
    if (isFavorite !== undefined) credential.isFavorite = Boolean(isFavorite);

    // If new password provided, re-encrypt with fresh IV and auth tag
    if (password && password.trim() !== '') {
      const strength = evaluatePasswordStrength(password);
      const { encryptedPassword, iv, authTag } = encryptPassword(password, userId.toString());
      const passwordFingerprint = createPasswordFingerprint(password, userId.toString());

      credential.encryptedPassword = encryptedPassword;
      credential.iv = iv;
      credential.authTag = authTag;
      credential.passwordFingerprint = passwordFingerprint;
      credential.passwordStrength = {
        score: strength.score,
        label: strength.label,
      };
    }

    await credential.save();

    return res.status(200).json({
      success: true,
      message: 'Credential updated successfully.',
      credential: {
        _id: credential._id,
        websiteName: credential.websiteName,
        websiteUrl: credential.websiteUrl,
        username: credential.username,
        category: credential.category,
        notes: credential.notes,
        isFavorite: credential.isFavorite,
        passwordStrength: credential.passwordStrength,
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle favorite status
 * PATCH /api/credentials/:id/favorite
 */
export async function toggleFavorite(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const credential = await Credential.findOne({ _id: id, userId });
    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential record not found or access denied.',
      });
    }

    credential.isFavorite = !credential.isFavorite;
    await credential.save();

    return res.status(200).json({
      success: true,
      message: credential.isFavorite ? 'Added to favorites' : 'Removed from favorites',
      isFavorite: credential.isFavorite,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a credential
 * DELETE /api/credentials/:id
 */
export async function deleteCredential(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const credential = await Credential.findOneAndDelete({ _id: id, userId });
    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential record not found or access denied.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Credential permanently removed.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get aggregated statistics for user's dashboard
 * GET /api/credentials/stats
 */
export async function getStats(req, res, next) {
  try {
    const userId = req.user._id;

    const totalCredentials = await Credential.countDocuments({ userId });
    const favoriteCount = await Credential.countDocuments({ userId, isFavorite: true });

    // Distinct categories used by user
    const distinctCategories = await Credential.distinct('category', { userId });

    // Weak passwords (score < 2)
    const weakPasswordsCount = await Credential.countDocuments({
      userId,
      'passwordStrength.score': { $lt: 2 },
    });

    // Reused passwords count via fingerprint aggregation
    const reuseAggregation = await Credential.aggregate([
      { $match: { userId } },
      { $group: { _id: '$passwordFingerprint', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]);

    const reusedPasswordsCount = reuseAggregation.reduce((acc, curr) => acc + curr.count, 0);

    // Calculate overall security health score (0 - 100)
    let securityHealthScore = 100;
    if (totalCredentials > 0) {
      const weakPenalty = (weakPasswordsCount / totalCredentials) * 50;
      const reusePenalty = (reusedPasswordsCount / totalCredentials) * 50;
      securityHealthScore = Math.max(0, Math.round(100 - weakPenalty - reusePenalty));
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalCredentials,
        favoriteCount,
        categoriesCount: distinctCategories.length,
        weakPasswordsCount,
        reusedPasswordsCount,
        securityHealthScore,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get comprehensive Security Center analysis
 * GET /api/credentials/security-analysis
 */
export async function getSecurityAnalysis(req, res, next) {
  try {
    const userId = req.user._id;

    const totalCredentials = await Credential.countDocuments({ userId });

    // 1. Weak passwords
    const weakCredentials = await Credential.find({
      userId,
      'passwordStrength.score': { $lt: 2 },
    }).select('websiteName websiteUrl username category passwordStrength updatedAt');

    // 2. Reused passwords detection
    const reuseAggregation = await Credential.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$passwordFingerprint',
          count: { $sum: 1 },
          credentials: {
            $push: {
              _id: '$_id',
              websiteName: '$websiteName',
              websiteUrl: '$websiteUrl',
              username: '$username',
              category: '$category',
              updatedAt: '$updatedAt',
            },
          },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    // 3. Recently updated credentials (last 10)
    const recentlyUpdated = await Credential.find({ userId })
      .select('websiteName websiteUrl username category updatedAt')
      .sort({ updatedAt: -1 })
      .limit(10);

    // Calculate score
    const reusedCount = reuseAggregation.reduce((acc, curr) => acc + curr.count, 0);
    let healthScore = 100;
    if (totalCredentials > 0) {
      const weakPenalty = (weakCredentials.length / totalCredentials) * 50;
      const reusePenalty = (reusedCount / totalCredentials) * 50;
      healthScore = Math.max(0, Math.round(100 - weakPenalty - reusePenalty));
    }

    // Security recommendations list
    const recommendations = [];
    if (weakCredentials.length > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Upgrade Weak Passwords',
        description: `You have ${weakCredentials.length} password(s) considered weak. Use the password generator to create complex passwords with 16+ characters.`,
      });
    }

    if (reuseAggregation.length > 0) {
      recommendations.push({
        type: 'critical',
        title: 'Eliminate Password Reuse',
        description: `Identified ${reusedCount} credential(s) sharing identical passwords across ${reuseAggregation.length} groups. Reusing passwords exposes multiple accounts if one is compromised.`,
      });
    }

    if (totalCredentials === 0) {
      recommendations.push({
        type: 'info',
        title: 'Start Populating Your Vault',
        description: 'Add your first login credentials to protect your online accounts with SecureVault.',
      });
    } else {
      recommendations.push({
        type: 'success',
        title: 'Zero-Knowledge Client Isolation Active',
        description: 'Your saved passwords are encrypted with individual AES-256-GCM cipher keys and authenticated tags.',
      });
    }

    return res.status(200).json({
      success: true,
      securityAnalysis: {
        totalCredentials,
        healthScore,
        weakCredentials,
        reusedGroups: reuseAggregation,
        recentlyUpdated,
        recommendations,
      },
    });
  } catch (error) {
    next(error);
  }
}
