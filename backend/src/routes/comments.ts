import { Router } from 'express';
import { 
  getComments, 
  createComment, 
  updateComment, 
  deleteComment,
  approveComment,
  unapproveComment,
} from '../controllers/commentController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validateRequest, validateParams, createCommentSchema, updateCommentSchema, idParamSchema, postIdParamSchema } from '../middleware/validation';

const router = Router();

// Public routes
router.get('/post/:postId', optionalAuth, validateParams(postIdParamSchema), getComments);

// Protected routes
router.post('/', authenticateToken, validateRequest(createCommentSchema), createComment);
router.put('/:id', authenticateToken, validateParams(idParamSchema), validateRequest(updateCommentSchema), updateComment);
router.delete('/:id', authenticateToken, validateParams(idParamSchema), deleteComment);

// Moderation routes (protected)
router.post('/:id/approve', authenticateToken, validateParams(idParamSchema), approveComment);
router.post('/:id/unapprove', authenticateToken, validateParams(idParamSchema), unapproveComment);

export default router;