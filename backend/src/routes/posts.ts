import { Router } from 'express';
import { 
  getPosts, 
  getPostById, 
  createPost, 
  updatePost, 
  deletePost, 
  likePost 
} from '../controllers/postController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validateRequest, validateParams, createPostSchema, updatePostSchema, idParamSchema } from '../middleware/validation';

const router = Router();

// Public routes (with optional authentication)
router.get('/', optionalAuth, getPosts);
router.get('/:id', optionalAuth, validateParams(idParamSchema), getPostById);

// Protected routes
router.post('/', authenticateToken, validateRequest(createPostSchema), createPost);
router.put('/:id', authenticateToken, validateParams(idParamSchema), validateRequest(updatePostSchema), updatePost);
router.delete('/:id', authenticateToken, validateParams(idParamSchema), deletePost);
router.post('/:id/like', authenticateToken, likePost);

export default router;