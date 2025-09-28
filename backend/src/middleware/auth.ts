import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, JWTPayload } from '../types';
import { User } from '../models';
import { verifyToken } from '../utils/jwt';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = verifyToken(token) as JWTPayload;
    
    // Verify user still exists
    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = verifyToken(token) as JWTPayload;
    
    const user = await User.findByPk(decoded.id);
    if (user && user.isActive) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        username: decoded.username,
      };
    }
  } catch (error) {
    // Silently fail for optional auth
  }

  next();
};