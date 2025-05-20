import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config'; // ✅ Import ConfigModule
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

import { CloudinaryModule } from 'src/cloudinary/coudinary.module';
import { uploadSchema } from './schemas/file.schema'; // Adjust the import path as necessary

@Module({
  imports: [
    ConfigModule, // ✅ Add this to make ConfigService available
    MongooseModule.forFeature([{ name: 'Upload', schema: uploadSchema }]), // Register schema

    CloudinaryModule,
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
