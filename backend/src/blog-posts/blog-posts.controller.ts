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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { BlogPostsService } from './blog-posts.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { CreateDraftDto } from './dto/create-draft.dto';
import { AutoSaveDraftDto } from './dto/auto-save-draft.dto';
import { PublishDraftDto } from './dto/publish-draft.dto';
import { SearchBlogPostsDto } from './dto/search-blog-posts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadsService } from '../uploads/uploads.service';
import { MulterFile } from '../types/multer.types';
import { multerConfig } from '../config/multer.config';

@ApiTags('Blog Posts')
@Controller('blog-posts')
export class BlogPostsController {
  constructor(
    private readonly blogPostsService: BlogPostsService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new blog post' })
  @ApiResponse({ status: 201, description: 'Blog post created successfully' })
  create(@Body() createBlogPostDto: CreateBlogPostDto, @Request() req) {
    return this.blogPostsService.create(createBlogPostDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all blog posts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all blog posts' })
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
  ) {
    return this.blogPostsService.findAll(+page, +limit, status);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search blog posts' })
  @ApiResponse({ status: 200, description: 'Return search results' })
  search(@Query() searchDto: SearchBlogPostsDto) {
    return this.blogPostsService.search(searchDto);
  }

  @Get('my-posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user blog posts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Return user blog posts' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user drafts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Return user drafts' })
  findMyDrafts(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.blogPostsService.findDrafts(req.user.userId, +page, +limit);
  }

  @Get('drafts/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all drafts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Return all drafts' })
  findAllDrafts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.blogPostsService.findAllDrafts(+page, +limit);
  }

  @Get('drafts/:id/preview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Preview draft' })
  @ApiParam({ name: 'id', description: 'Draft ID' })
  @ApiResponse({ status: 200, description: 'Return draft preview' })
  getDraftPreview(@Param('id') id: string, @Request() req) {
    return this.blogPostsService.getDraftPreview(id, req.user.userId);
  }

  @Get('scheduled')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get scheduled posts' })
  @ApiResponse({ status: 200, description: 'Return scheduled posts' })
  getScheduledPosts() {
    return this.blogPostsService.getScheduledPosts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get blog post by ID' })
  @ApiParam({ name: 'id', description: 'Blog post ID' })
  @ApiResponse({ status: 200, description: 'Return blog post' })
  @ApiResponse({ status: 400, description: 'Invalid post ID format' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findOne(@Param('id') id: string) {
    // Validate that id is a valid ObjectId to prevent matching on routes like 'search'
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestException('Invalid post ID format');
    }
    await this.blogPostsService.incrementViews(id);
    return this.blogPostsService.findOne(id);
  }

  @Get(':id/with-engagement')
  @ApiOperation({ summary: 'Get blog post with engagement data' })
  @ApiParam({ name: 'id', description: 'Blog post ID' })
  @ApiResponse({ status: 200, description: 'Return blog post with engagement' })
  async findOneWithEngagement(@Param('id') id: string) {
    await this.blogPostsService.incrementViews(id);
    return this.blogPostsService.findOneWithEngagement(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update blog post' })
  @ApiParam({ name: 'id', description: 'Blog post ID' })
  @ApiResponse({ status: 200, description: 'Blog post updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateBlogPostDto: UpdateBlogPostDto,
    @Request() req,
  ) {
    return this.blogPostsService.update(id, updateBlogPostDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete blog post' })
  @ApiParam({ name: 'id', description: 'Blog post ID' })
  @ApiResponse({ status: 200, description: 'Blog post deleted successfully' })
  remove(@Param('id') id: string, @Request() req) {
    return this.blogPostsService.remove(id, req.user.userId);
  }

  // Draft-specific endpoints
  @Post('drafts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create draft' })
  @ApiResponse({ status: 201, description: 'Draft created successfully' })
  createDraft(@Body() createDraftDto: CreateDraftDto, @Request() req) {
    return this.blogPostsService.createDraft(createDraftDto, req.user.userId);
  }

  @Patch('drafts/:id/auto-save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Auto-save draft' })
  @ApiParam({ name: 'id', description: 'Draft ID' })
  @ApiResponse({ status: 200, description: 'Draft auto-saved successfully' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Publish draft' })
  @ApiParam({ name: 'id', description: 'Draft ID' })
  @ApiResponse({ status: 200, description: 'Draft published successfully' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Archive draft' })
  @ApiParam({ name: 'id', description: 'Draft ID' })
  @ApiResponse({ status: 200, description: 'Draft archived successfully' })
  archiveDraft(@Param('id') id: string, @Request() req) {
    return this.blogPostsService.archiveDraft(id, req.user.userId);
  }

  @Post('drafts/:id/restore')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Restore draft' })
  @ApiParam({ name: 'id', description: 'Draft ID' })
  @ApiResponse({ status: 200, description: 'Draft restored successfully' })
  restoreDraft(@Param('id') id: string, @Request() req) {
    return this.blogPostsService.restoreDraft(id, req.user.userId);
  }

  @Post('scheduled/:id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Publish scheduled post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post published successfully' })
  publishScheduledPost(@Param('id') id: string) {
    return this.blogPostsService.publishScheduledPost(id);
  }

  // File upload endpoints for blog posts
  @Post(':id/featured-image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ summary: 'Upload featured image for blog post' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Blog post ID' })
  @ApiResponse({ status: 200, description: 'Featured image uploaded successfully' })
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
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ summary: 'Upload attachment for blog post' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Blog post ID' })
  @ApiResponse({ status: 200, description: 'Attachment uploaded successfully' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove attachment from blog post' })
  @ApiParam({ name: 'id', description: 'Blog post ID' })
  @ApiQuery({ name: 'attachmentUrl', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Attachment removed successfully' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove featured image from blog post' })
  @ApiParam({ name: 'id', description: 'Blog post ID' })
  @ApiResponse({ status: 200, description: 'Featured image removed successfully' })
  async removeFeaturedImage(@Param('id') id: string, @Request() req) {
    return this.blogPostsService.removeFeaturedImage(id, req.user.userId);
  }
}
