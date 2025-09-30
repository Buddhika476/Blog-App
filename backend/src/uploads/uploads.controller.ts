import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MulterFile } from '../types/multer.types';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: MulterFile,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Additional validation for images
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const result = await this.uploadsService.saveFile(file);

    return {
      message: 'Image uploaded successfully',
      file: result,
      uploadedBy: req.user.userId,
    };
  }

  @Post('document')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: MulterFile,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    if (!this.uploadsService.validateFileType(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }

    const result = await this.uploadsService.saveFile(file);

    return {
      message: 'Document uploaded successfully',
      file: result,
      uploadedBy: req.user.userId,
    };
  }

  @Get('info/:filename')
  async getFileInfo(@Param('filename') filename: string) {
    const info = await this.uploadsService.getFileInfo(filename);

    if (!info.exists) {
      throw new NotFoundException('File not found');
    }

    return {
      filename,
      size: this.uploadsService.formatFileSize(info.size),
      url: info.url,
    };
  }

  @Delete(':filename')
  @UseGuards(JwtAuthGuard)
  async deleteFile(@Param('filename') filename: string, @Request() req) {
    // In a production app, you might want to check if the user owns the file
    // or has permission to delete it

    const info = await this.uploadsService.getFileInfo(filename);
    if (!info.exists) {
      throw new NotFoundException('File not found');
    }

    await this.uploadsService.deleteFile(filename);

    return {
      message: 'File deleted successfully',
      filename,
      deletedBy: req.user.userId,
    };
  }
}