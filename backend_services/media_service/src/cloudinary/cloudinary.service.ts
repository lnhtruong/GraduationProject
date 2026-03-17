import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import axios from 'axios';
import * as path from 'path';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: 'dbwqzrbur',
      api_key: '',
      api_secret: '',
      secure: true,
    });
  }

  // ==============================
  // 📤 Upload video lên Cloudinary
  // ==============================
  async uploadToCloudinary(
    localFilePath: string,
    folderName: string = 'highlight_videos/1784452170',
  ): Promise<string> {
    console.log(`☁️ Uploading: ${localFilePath}...`);

    try {
      const result = await cloudinary.uploader.upload(localFilePath, {
        resource_type: 'video',
        folder: folderName,
        public_id: path.parse(localFilePath).name,
        context: {
          "user_id": "1",
          "type": "highlight",
        }
      });

      console.log('✅ Upload thành công:', result.secure_url);
      return result.secure_url;
    } catch (error: any) {
      console.error('❌ Upload lỗi:', error.message);
      return '';
    }
  }

  // ==============================
  // ⬇️ Download video từ URL
  // ==============================
  async downloadVideoFromUrl(
    url: string,
    outputPath: string,
  ): Promise<string> {
    console.log(`⬇️ Downloading: ${url}`);

    try {
      const response = await axios({
        method: 'GET',
        url,
        responseType: 'stream',
      });

      const writer = fs.createWriteStream(outputPath);

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log('✅ Download xong:', outputPath);
          resolve(outputPath);
        });
        writer.on('error', reject);
      });
    } catch (error: any) {
      console.error('❌ Download lỗi:', error.message);
      throw error;
    }
  }
}