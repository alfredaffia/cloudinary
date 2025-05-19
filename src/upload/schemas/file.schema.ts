import { Schema, Document } from 'mongoose';

export interface UploadDocument extends Document {
  filename: string;
  url: string;
  format: string;
  size: number;
  uploadedAt: Date;
}

export const UploadSchema = new Schema<UploadDocument>({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  format: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now },
});
