import AWS from 'aws-sdk';
import { S3UploadResult } from '../types';

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

// Enforce bucket configuration unless using local upload fallback
const USE_LOCAL_UPLOAD = process.env.USE_LOCAL_UPLOAD === 'true';
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
if (!USE_LOCAL_UPLOAD && !AWS_S3_BUCKET) {
  throw new Error('AWS_S3_BUCKET is not set. Configure process.env.AWS_S3_BUCKET');
}

export const uploadToS3 = (
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<S3UploadResult> => {
  const bucket = AWS_S3_BUCKET;
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET is not set. S3 upload is disabled when USE_LOCAL_UPLOAD=true');
  }
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
  
  const uploadParams = {
    Bucket: bucket,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  };

  return new Promise((resolve, reject) => {
    s3.upload(uploadParams, (error: Error, data: AWS.S3.ManagedUpload.SendData) => {
      if (error) {
        reject(error);
      } else {
        resolve(data as S3UploadResult);
      }
    });
  });
};

export const deleteFromS3 = (key: string): Promise<void> => {
  const bucket = AWS_S3_BUCKET;
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET is not set. S3 delete is disabled when USE_LOCAL_UPLOAD=true');
  }
  const deleteParams = {
    Bucket: bucket,
    Key: key,
  };

  return new Promise((resolve, reject) => {
    s3.deleteObject(deleteParams, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

export const generateSignedUrl = (key: string, expiresIn: number = 3600): string => {
  const bucket = AWS_S3_BUCKET;
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET is not set. Signed URL is unavailable when USE_LOCAL_UPLOAD=true');
  }
  return s3.getSignedUrl('getObject', {
    Bucket: bucket,
    Key: key,
    Expires: expiresIn,
  });
};