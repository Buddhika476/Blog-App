import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { AppLoggerService } from '../common/logger/logger.service';
import { MulterFile } from '../types/multer.types';

@Injectable()
export class UploadsService {
  constructor(private logger: AppLoggerService) {}

  async saveFile(file: MulterFile): Promise<{
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
  }> {
    try {
      this.logger.debug(`Saving file: ${file.originalname}`, 'UploadsService');

      const result = {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
      };

      this.logger.log(`File saved successfully: ${file.filename}`, 'UploadsService', {
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      });

      return result;
    } catch (error) {
      this.logger.logError(error, 'UploadsService.saveFile', {
        originalName: file.originalname,
        size: file.size,
      });
      throw error;
    }
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      const filePath = join('./uploads', filename);
      await fs.unlink(filePath);

      this.logger.log(`File deleted successfully: ${filename}`, 'UploadsService');
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.warn(`File not found for deletion: ${filename}`, 'UploadsService');
        return; // File doesn't exist, consider it deleted
      }

      this.logger.logError(error, 'UploadsService.deleteFile', { filename });
      throw error;
    }
  }

  async getFileInfo(filename: string): Promise<{
    exists: boolean;
    size?: number;
    url?: string;
  }> {
    try {
      const filePath = join('./uploads', filename);
      const stats = await fs.stat(filePath);

      return {
        exists: true,
        size: stats.size,
        url: `/uploads/${filename}`,
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { exists: false };
      }
      throw error;
    }
  }

  validateFileType(mimetype: string): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    return allowedTypes.includes(mimetype);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}