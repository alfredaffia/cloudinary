import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot(), // Loads environment variables
    MongooseModule.forRoot(process.env.DB_URI || 'Flexwidflash:08024575820@cluster0.c6i2qkb.mongodb.net/file-system'), UploadModule, // Connects to MongoDB
  ],
})
export class AppModule {}
