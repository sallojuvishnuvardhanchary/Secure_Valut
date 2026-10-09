import express from 'express';
import {
  getCredentials,
  getCredentialById,
  createCredential,
  updateCredential,
  toggleFavorite,
  deleteCredential,
  getStats,
  getSecurityAnalysis,
} from '../controllers/credentialController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All credential routes require authentication
router.use(protect);

router.get('/', getCredentials);
router.post('/', createCredential);
router.get('/stats', getStats);
router.get('/security-analysis', getSecurityAnalysis);
router.get('/:id', getCredentialById);
router.patch('/:id', updateCredential);
router.patch('/:id/favorite', toggleFavorite);
router.delete('/:id', deleteCredential);

export default router;
