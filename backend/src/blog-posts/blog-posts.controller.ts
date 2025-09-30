import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BlogPostsService } from './blog-posts.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { CreateDraftDto } from './dto/create-draft.dto';
import { AutoSaveDraftDto } from './dto/auto-save-draft.dto';
import { PublishDraftDto } from './dto/publish-draft.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadsService } from '../uploads/uploads.service';
import { MulterFile } from '../types/multer.types';
import { multerConfig } from '../config/multer.config';

@Controller('blog-posts')
export class BlogPostsController {
  constructor(
    private readonly blogPostsService: BlogPostsService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createBlogPostDto: CreateBlogPostDto, @Request() req) {
    return this.blogPostsService.create(createBlogPostDto, req.user.userId);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
  ) {
    return this.blogPostsService.findAll(+page, +limit, status);
  }

  @Get('my-posts')
  @UseGuards(JwtAuthGuard)
  findMyPosts(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.blogPostsService.findByAuthor(req.user.userId, +page, +limit);
  }

  // Draft-specific endpoints (moved before :id routes)
  @Get('drafts')
  @UseGuards(JwtAuthGuard)
  findMyDrafts(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.blogPostsService.findDrafts(req.user.userId, +page, +limit);
  }

  @Get('drafts/all')
  @UseGuards(JwtAuthGuard)
  findAllDrafts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.blogPostsService.findAllDrafts(+page, +limit);
  }

  @Get('drafts/:id/preview')
  @UseGuards(JwtAuthGuard)
  getDraftPreview(@Param('id') id: string, @Request() req) {
    return this.blogPostsService.getDraftPreview(id, req.user.userId);
  }

  @Get('scheduled')
  @UseGuards(JwtAuthGuard)
  getScheduledPosts() {
    return this.blogPostsService.getScheduledPosts();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    await this.blogPostsService.incrementViews(id);
    return this.blogPostsService.findOne(id);
  }

  @Get(':id/with-engagement')
  async findOneWithEngagement(@Param('id') id: string) {
    await this.blogPostsService.incrementViews(id);
    return this.blogPostsService.findOneWithEngagement(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateBlogPostDto: UpdateBlogPostDto,
    @Request() req,
  ) {
    return this.blogPostsService.update(id, updateBlogPostDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.blogPostsService.remove(id, req.user.userId);
  }

  // Draft-specific endpoints
  @Post('drafts')
  @UseGuards(JwtAuthGuard)
  createDraft(@Body() createDraftDto: CreateDraftDto, @Request() req) {
    return this.blogPostsService.createDraft(createDraftDto, req.user.userId);
  }

  @Patch('drafts/:id/auto-save')
  @UseGuards(JwtAuthGuard)
  autoSaveDraft(
    @Param('id') id: string,
    @Body() autoSaveDraftDto: AutoSaveDraftDto,
    @Request() req,
  ) {
    return this.blogPostsService.autoSaveDraft(
      id,
      autoSaveDraftDto,
      req.user.userId,
    );
  }

  @Post('drafts/:id/publish')
  @UseGuards(JwtAuthGuard)
  publishDraft(
    @Param('id') id: string,
    @Body() publishDraftDto: PublishDraftDto,
    @Request() req,
  ) {
    return this.blogPostsService.publishDraft(
      id,
      publishDraftDto,
      req.user.userId,
    );
  }

  @Post('drafts/:id/archive')
  @UseGuards(JwtAuthGuard)
  archiveDraft(@Param('id') id: string, @Request() req) {
    return this.blogPostsService.archiveDraft(id, req.user.userId);
  }

  @Post('drafts/:id/restore')
  @UseGuards(JwtAuthGuard)
  restoreDraft(@Param('id') id: string, @Request() req) {
    return this.blogPostsService.restoreDraft(id, req.user.userId);
  }

  @Post('scheduled/:id/publish')
  @UseGuards(JwtAuthGuard)
  publishScheduledPost(@Param('id') id: string) {
    return this.blogPostsService.publishScheduledPost(id);
  }

  // File upload endpoints for blog posts
  @Post(':id/featured-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadFeaturedImage(
    @Param('id') id: string,
    @UploadedFile() file: MulterFile,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed for featured image');
    }

    const fileInfo = await this.uploadsService.saveFile(file);

    return this.blogPostsService.updateFeaturedImage(
      id,
      fileInfo.url,
      req.user.userId,
    );
  }

  @Post(':id/attachment')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadAttachment(
    @Param('id') id: string,
    @UploadedFile() file: MulterFile,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!this.uploadsService.validateFileType(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }

    const fileInfo = await this.uploadsService.saveFile(file);

    return this.blogPostsService.addAttachment(
      id,
      fileInfo.url,
      req.user.userId,
    );
  }

  @Delete(':id/attachment')
  @UseGuards(JwtAuthGuard)
  async removeAttachment(
    @Param('id') id: string,
    @Query('attachmentUrl') attachmentUrl: string,
    @Request() req,
  ) {
    if (!attachmentUrl) {
      throw new BadRequestException('attachmentUrl query parameter is required');
    }

    return this.blogPostsService.removeAttachment(
      id,
      attachmentUrl,
      req.user.userId,
    );
  }

  @Delete(':id/featured-image')
  @UseGuards(JwtAuthGuard)
  async removeFeaturedImage(@Param('id') id: string, @Request() req) {
    return this.blogPostsService.removeFeaturedImage(id, req.user.userId);
  }
}
