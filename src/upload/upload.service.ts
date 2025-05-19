import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UploadDocument } from './schemas/file.schema';

@Injectable()
export class UploadService {
  constructor(@InjectModel('Upload') private readonly uploadModel: Model<UploadDocument>) {}

  async uploadFile(file: Express.Multer.File): Promise<UploadApiResponse> {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    // ✅ File Type Validation (Allow only images & PDFs)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPG, PNG, and PDF are allowed.');
    }

    // ✅ File Size Validation (Limit: 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File size exceeds 5MB limit.');
    }

    return new Promise(async (resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' },
        async (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            return reject(new BadRequestException('File upload failed.'));
          }
    
          if (!result) {
            return reject(new BadRequestException('Cloudinary did not return a result.'));
          }
    
          
          try {
            const uploadedFile = new this.uploadModel({
              filename: file.originalname,
              url: result.secure_url,
              format: result.format,
              size: file.size,
              uploadedAt: new Date(),
            });
    
            await uploadedFile.save(); // Save to MongoDB
            resolve(result); // Return the Cloudinary response
          } catch (dbError) {
            console.error('Database Save Error:', dbError);
            reject(new BadRequestException('Database save failed.'));
          }
        },
      );
    
      // ✅ Convert buffer to a readable stream and upload
      const fileStream = Readable.from(file.buffer);
      fileStream.pipe(uploadStream);
    });}}