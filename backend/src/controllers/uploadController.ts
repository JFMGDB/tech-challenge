import { Response } from 'express';
import multer from 'multer';
import AWS from 'aws-sdk';
import { AuthenticatedRequest } from '../types';
import { uploadToS3, deleteFromS3 } from '../utils/s3';

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

// Multer configuration for memory storage
const memoryStorage = multer.memoryStorage();

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
  }
};

// Export multer configurations
export const uploadMemory = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
  },
}).single('image');

// Multer configuration for direct S3 upload (alternative approach)
export const uploadS3Direct = multer({
  storage: multer.memoryStorage(), // Use memory storage instead for now
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
  },
}).single('image');

// Upload controller using memory storage and manual S3 upload
export const uploadImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Upload to S3
    const result = await uploadToS3(req.file, 'post-images');

    res.status(200).json({
      message: 'File uploaded successfully',
      file: {
        url: result.Location,
        key: result.Key,
        bucket: result.Bucket,
        etag: result.ETag,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      // Avoid leaking internal details; expose generic message
      detail: 'An error occurred while uploading the file. Please try again later.'
    });
  }
};

// Upload controller using direct S3 upload
export const uploadImageDirect = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // File is already uploaded to S3 by multer-s3
    const file = req.file as Express.MulterS3.File;

    res.status(200).json({
      message: 'File uploaded successfully',
      file: {
        url: file.location,
        key: file.key,
        bucket: file.bucket,
        etag: file.etag,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      detail: 'An error occurred while uploading the file. Please try again later.'
    });
  }
};

// Delete image from S3
export const deleteImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { key } = req.params;
    
    if (!key) {
      res.status(400).json({ error: 'File key is required' });
      return;
    }

    await deleteFromS3(key);

    res.status(200).json({
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      error: 'Delete failed',
      detail: 'An error occurred while deleting the file. Please try again later.'
    });
  }
};