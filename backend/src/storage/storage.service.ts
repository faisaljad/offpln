import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { put, del } from '@vercel/blob';
import { v4 as uuid } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

type StorageDriver = 'vercel-blob' | 's3' | 'minio' | 'local';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private driver: StorageDriver;
  private s3: S3Client | null = null;
  private bucket: string;
  private localUploadDir: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || 'offplan-assets';
    this.localUploadDir = path.join(process.cwd(), 'uploads');

    const hasVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
    const hasAws =
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_ACCESS_KEY_ID !== 'your_aws_access_key';
    const hasMinio = !!process.env.MINIO_ENDPOINT;

    if (hasVercelBlob) {
      this.driver = 'vercel-blob';
      this.logger.log('Storage driver: Vercel Blob');
    } else if (hasMinio) {
      this.driver = 'minio';
      this.s3 = new S3Client({
        endpoint: process.env.MINIO_ENDPOINT,
        region: 'us-east-1',
        credentials: {
          accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
          secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
        },
        forcePathStyle: true,
      });
      this.logger.log('Storage driver: MinIO');
    } else if (hasAws) {
      this.driver = 's3';
      this.s3 = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
      this.logger.log('Storage driver: AWS S3');
    } else {
      this.driver = 'local';
      const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
      this.localUploadDir = isServerless ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');
      try { fs.mkdirSync(this.localUploadDir, { recursive: true }); } catch {}
      this.logger.warn('Storage driver: LOCAL DISK (not for production)');
    }
  }

  async onModuleInit() {
    if (this.driver === 'minio' && this.s3) {
      await this.ensureBucket();
    }
  }

  private async ensureBucket() {
    try {
      await this.s3!.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`MinIO bucket "${this.bucket}" already exists`);
    } catch {
      await this.s3!.send(new CreateBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`MinIO bucket "${this.bucket}" created`);
    }

    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        },
      ],
    });
    try {
      await this.s3!.send(new PutBucketPolicyCommand({ Bucket: this.bucket, Policy: policy }));
      this.logger.log(`MinIO bucket "${this.bucket}" set to public-read`);
    } catch (err: any) {
      this.logger.warn(`Could not set bucket policy: ${err.message}`);
    }
  }

  async upload(file: Express.Multer.File, folder = 'properties'): Promise<string> {
    if (this.driver === 'vercel-blob') return this.uploadVercelBlob(file, folder);
    if (this.driver === 'local') return this.uploadLocal(file, folder);
    return this.uploadS3(file, folder);
  }

  async uploadMany(files: Express.Multer.File[], folder = 'properties'): Promise<string[]> {
    return Promise.all(files.map((f) => this.upload(f, folder)));
  }

  async delete(url: string): Promise<void> {
    if (this.driver === 'vercel-blob') {
      try { await del(url); } catch {}
      return;
    }

    if (this.driver === 'local') {
      const filename = url.split('/uploads/')[1];
      if (filename) {
        const filePath = path.join(this.localUploadDir, filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      return;
    }

    const key =
      this.driver === 'minio'
        ? url.split(`/${this.bucket}/`)[1]
        : url.split('.amazonaws.com/')[1];

    if (key && this.s3) {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    }
  }

  // --- private helpers ---

  private async uploadVercelBlob(file: Express.Multer.File, folder: string): Promise<string> {
    const ext = path.extname(file.originalname);
    const filename = `${folder}/${uuid()}${ext}`;

    try {
      const blob = await put(filename, file.buffer, {
        access: 'public',
        contentType: file.mimetype,
      });
      return blob.url;
    } catch (err: any) {
      throw new InternalServerErrorException(`Vercel Blob upload failed: ${err.message}`);
    }
  }

  private async uploadLocal(file: Express.Multer.File, folder: string): Promise<string> {
    const ext = path.extname(file.originalname);
    const filename = `${folder}-${uuid()}${ext}`;
    const dest = path.join(this.localUploadDir, filename);
    fs.writeFileSync(dest, file.buffer);
    const baseUrl = process.env.BACKEND_URL || process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
    return `${baseUrl}/uploads/${filename}`;
  }

  private async uploadS3(file: Express.Multer.File, folder: string): Promise<string> {
    const ext = path.extname(file.originalname);
    const key = `${folder}/${uuid()}${ext}`;

    try {
      await this.s3!.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ...(this.driver === 's3' ? { ACL: 'public-read' as const } : {}),
        }),
      );

      if (this.driver === 'minio') {
        const publicBase = process.env.MINIO_PUBLIC_URL || process.env.MINIO_ENDPOINT;
        return `${publicBase}/${this.bucket}/${key}`;
      }
      return `https://${this.bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    } catch (err: any) {
      throw new InternalServerErrorException(`Upload failed: ${err.message}`);
    }
  }
}
