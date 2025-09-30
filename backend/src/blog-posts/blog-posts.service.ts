import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BlogPost, BlogPostDocument } from './blog-post.schema';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { CreateDraftDto } from './dto/create-draft.dto';
import { AutoSaveDraftDto } from './dto/auto-save-draft.dto';
import { PublishDraftDto } from './dto/publish-draft.dto';
import { SearchBlogPostsDto } from './dto/search-blog-posts.dto';
import { AppLoggerService } from '../common/logger/logger.service';

@Injectable()
export class BlogPostsService {
  constructor(
    @InjectModel(BlogPost.name) private blogPostModel: Model<BlogPostDocument>,
    private logger: AppLoggerService,
  ) {}

  async create(
    createBlogPostDto: CreateBlogPostDto,
    authorId: string,
  ): Promise<BlogPost> {
    try {
      this.logger.debug(`Creating new blog post for author: ${authorId}`, 'BlogPostsService');

      // Validate authorId is a valid ObjectId
      if (!Types.ObjectId.isValid(authorId)) {
        this.logger.warn(`Invalid author ID format: ${authorId}`, 'BlogPostsService');
        throw new Error('Invalid author ID format');
      }

      const blogPostData = {
        ...createBlogPostDto,
        author: new Types.ObjectId(authorId),
        isDraft: createBlogPostDto.status === 'draft',
        publishedAt: createBlogPostDto.status === 'published' ? new Date() : null,
      };

      this.logger.debug(`Blog post data before save: ${JSON.stringify(blogPostData)}`, 'BlogPostsService');

      const blogPost = new this.blogPostModel(blogPostData);
      const savedPost = await blogPost.save();
      
      this.logger.log(
        `Blog post created successfully: ${savedPost._id}`,
        'BlogPostsService',
        { postId: savedPost._id, authorId, title: savedPost.title, status: savedPost.status }
      );
      
      return savedPost;
    } catch (error) {
      this.logger.logError(error, 'BlogPostsService.create', { authorId, title: createBlogPostDto.title });
      throw error;
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: string,
  ): Promise<{ posts: BlogPost[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter = status ? { status } : {};

    const posts = await this.blogPostModel
      .find(filter)
      .populate('author', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.blogPostModel.countDocuments(filter);

    return { posts, total };
  }

  async search(searchDto: SearchBlogPostsDto): Promise<{ posts: BlogPost[]; total: number }> {
    const page = parseInt(searchDto.page || '1');
    const limit = parseInt(searchDto.limit || '10');
    const skip = (page - 1) * limit;

    const filter: any = { status: 'published' };

    // Build search query if search term provided
    if (searchDto.query && searchDto.query.trim()) {
      const searchRegex = new RegExp(searchDto.query.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { excerpt: searchRegex },
        { content: searchRegex },
        { tags: searchRegex },
      ];
    }

    // Add tag filter if provided
    if (searchDto.tags && searchDto.tags.length > 0) {
      filter.tags = { $in: searchDto.tags };
    }

    const posts = await this.blogPostModel
      .find(filter)
      .populate('author', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.blogPostModel.countDocuments(filter);

    return { posts, total };
  }

  async findOne(id: string): Promise<BlogPost> {
    try {
      this.logger.debug(`Finding blog post: ${id}`, 'BlogPostsService');
      
      const post = await this.blogPostModel
        .findById(id)
        .populate('author', 'firstName lastName email')
        .exec();

      if (!post) {
        this.logger.warn(`Blog post not found: ${id}`, 'BlogPostsService');
        throw new NotFoundException('Blog post not found');
      }

      return post;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.logError(error, 'BlogPostsService.findOne', { postId: id });
      throw error;
    }
  }

  async findByAuthor(
    authorId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ posts: BlogPost[]; total: number }> {
    const skip = (page - 1) * limit;

    const posts = await this.blogPostModel
      .find({ author: new Types.ObjectId(authorId) })
      .populate('author', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.blogPostModel.countDocuments({ author: new Types.ObjectId(authorId) });

    return { posts, total };
  }

  async update(
    id: string,
    updateBlogPostDto: UpdateBlogPostDto,
    userId: string,
  ): Promise<BlogPost> {
    try {
      this.logger.debug(`Updating blog post: ${id} by user: ${userId}`, 'BlogPostsService');
      
      const post = await this.blogPostModel.findById(id);

      if (!post) {
        this.logger.warn(`Blog post not found for update: ${id}`, 'BlogPostsService');
        throw new NotFoundException('Blog post not found');
      }

      if (post.author.toString() !== userId) {
        this.logger.logSecurity('Unauthorized blog post update attempt', {
          postId: id,
          postAuthor: post.author.toString(),
          attemptedBy: userId
        });
        throw new ForbiddenException('You can only update your own posts');
      }

      const updateData: any = { ...updateBlogPostDto };
      if (
        updateBlogPostDto.status === 'published' &&
        post.status !== 'published'
      ) {
        updateData.publishedAt = new Date();
        this.logger.log(`Blog post published: ${id}`, 'BlogPostsService', { postId: id, userId });
      }

      const updatedPost = await this.blogPostModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate('author', 'firstName lastName email')
        .exec();

      this.logger.log(`Blog post updated successfully: ${id}`, 'BlogPostsService', { postId: id, userId });
      return updatedPost;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.logError(error, 'BlogPostsService.update', { postId: id, userId });
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      this.logger.debug(`Deleting blog post: ${id} by user: ${userId}`, 'BlogPostsService');
      
      const post = await this.blogPostModel.findById(id);

      if (!post) {
        this.logger.warn(`Blog post not found for deletion: ${id}`, 'BlogPostsService');
        throw new NotFoundException('Blog post not found');
      }

      if (post.author.toString() !== userId) {
        this.logger.logSecurity('Unauthorized blog post deletion attempt', {
          postId: id,
          postAuthor: post.author.toString(),
          attemptedBy: userId
        });
        throw new ForbiddenException('You can only delete your own posts');
      }

      await this.blogPostModel.deleteOne({ _id: id }).exec();
      
      this.logger.log(`Blog post deleted successfully: ${id}`, 'BlogPostsService', {
        postId: id,
        userId,
        title: post.title
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.logError(error, 'BlogPostsService.remove', { postId: id, userId });
      throw error;
    }
  }

  async findOneWithEngagement(id: string): Promise<any> {
    const post = await this.blogPostModel
      .findById(id)
      .populate('author', 'firstName lastName email')
      .exec();

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    return {
      ...post.toObject(),
      engagement: {
        likes: post.likesCount,
        comments: post.commentsCount,
        views: post.views,
      },
    };
  }

  async createDraft(
    createDraftDto: CreateDraftDto,
    authorId: string,
  ): Promise<BlogPost> {
    try {
      this.logger.debug(`Creating new draft for author: ${authorId}`, 'BlogPostsService');

      // Validate authorId is a valid ObjectId
      if (!Types.ObjectId.isValid(authorId)) {
        this.logger.warn(`Invalid author ID format: ${authorId}`, 'BlogPostsService');
        throw new Error('Invalid author ID format');
      }

      const draft = new this.blogPostModel({
        ...createDraftDto,
        author: new Types.ObjectId(authorId),
        status: 'draft',
        isDraft: true,
        title: createDraftDto.title || 'Untitled Draft',
        content: createDraftDto.content || '',
        excerpt: createDraftDto.excerpt || '',
      });

      const savedDraft = await draft.save();
      
      this.logger.log(
        `Draft created successfully: ${savedDraft._id}`,
        'BlogPostsService',
        { draftId: savedDraft._id, authorId, title: savedDraft.title }
      );
      
      return savedDraft;
    } catch (error) {
      this.logger.logError(error, 'BlogPostsService.createDraft', { authorId });
      throw error;
    }
  }

  async findDrafts(
    authorId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ drafts: BlogPost[]; total: number }> {
    const skip = (page - 1) * limit;

    const drafts = await this.blogPostModel
      .find({
        author: new Types.ObjectId(authorId),
        status: 'draft',
        isDraft: true,
      })
      .populate('author', 'firstName lastName email')
      .sort({ lastSavedAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.blogPostModel.countDocuments({
      author: new Types.ObjectId(authorId),
      status: 'draft',
      isDraft: true,
    });

    return { drafts, total };
  }

  async findAllDrafts(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ drafts: BlogPost[]; total: number }> {
    const skip = (page - 1) * limit;

    const drafts = await this.blogPostModel
      .find({
        status: 'draft',
        isDraft: true,
      })
      .populate('author', 'firstName lastName email')
      .sort({ lastSavedAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.blogPostModel.countDocuments({
      status: 'draft',
      isDraft: true,
    });

    return { drafts, total };
  }

  async autoSaveDraft(
    id: string,
    autoSaveDraftDto: AutoSaveDraftDto,
    userId: string,
  ): Promise<BlogPost> {
    try {
      this.logger.debug(`Auto-saving draft: ${id} by user: ${userId}`, 'BlogPostsService');
      
      const draft = await this.blogPostModel.findById(id);

      if (!draft) {
        this.logger.warn(`Draft not found for auto-save: ${id}`, 'BlogPostsService');
        throw new NotFoundException('Draft not found');
      }

      if (draft.author.toString() !== userId) {
        this.logger.logSecurity('Unauthorized draft auto-save attempt', {
          draftId: id,
          draftAuthor: draft.author.toString(),
          attemptedBy: userId
        });
        throw new ForbiddenException('You can only auto-save your own drafts');
      }

      if (draft.status !== 'draft') {
        this.logger.warn(`Attempted to auto-save non-draft: ${id}`, 'BlogPostsService');
        throw new ForbiddenException('Can only auto-save drafts');
      }

      const updatedDraft = await this.blogPostModel
        .findByIdAndUpdate(
          id,
          {
            ...autoSaveDraftDto,
            lastSavedAt: new Date(),
          },
          { new: true },
        )
        .populate('author', 'firstName lastName email')
        .exec();

      this.logger.debug(`Draft auto-saved successfully: ${id}`, 'BlogPostsService');
      return updatedDraft;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.logError(error, 'BlogPostsService.autoSaveDraft', { draftId: id, userId });
      throw error;
    }
  }

  async publishDraft(
    id: string,
    publishDraftDto: PublishDraftDto,
    userId: string,
  ): Promise<BlogPost> {
    try {
      this.logger.debug(`Publishing draft: ${id} by user: ${userId}`, 'BlogPostsService');
      
      const draft = await this.blogPostModel.findById(id);

      if (!draft) {
        this.logger.warn(`Draft not found for publishing: ${id}`, 'BlogPostsService');
        throw new NotFoundException('Draft not found');
      }

      if (draft.author.toString() !== userId) {
        this.logger.logSecurity('Unauthorized draft publish attempt', {
          draftId: id,
          draftAuthor: draft.author.toString(),
          attemptedBy: userId
        });
        throw new ForbiddenException('You can only publish your own drafts');
      }

      if (draft.status !== 'draft') {
        this.logger.warn(`Attempted to publish non-draft: ${id}`, 'BlogPostsService');
        throw new ForbiddenException('Can only publish drafts');
      }

      // Validate that required fields are present
      if (!draft.title || !draft.content || !draft.excerpt) {
        this.logger.warn(`Draft missing required fields for publishing: ${id}`, 'BlogPostsService');
        throw new ForbiddenException(
          'Draft must have title, content, and excerpt before publishing',
        );
      }

      const updateData: any = {
        status: 'published',
        isDraft: false,
        lastSavedAt: new Date(),
      };

      if (publishDraftDto.publishNow || !publishDraftDto.scheduledPublishAt) {
        updateData.publishedAt = new Date();
        this.logger.log(`Draft published immediately: ${id}`, 'BlogPostsService', { draftId: id, userId });
      } else {
        updateData.scheduledPublishAt = new Date(
          publishDraftDto.scheduledPublishAt,
        );
        this.logger.log(`Draft scheduled for publishing: ${id}`, 'BlogPostsService', {
          draftId: id,
          userId,
          scheduledAt: updateData.scheduledPublishAt
        });
      }

      const publishedPost = await this.blogPostModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate('author', 'firstName lastName email')
        .exec();

      return publishedPost;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.logError(error, 'BlogPostsService.publishDraft', { draftId: id, userId });
      throw error;
    }
  }

  async archiveDraft(id: string, userId: string): Promise<BlogPost> {
    const draft = await this.blogPostModel.findById(id);

    if (!draft) {
      throw new NotFoundException('Draft not found');
    }

    if (draft.author.toString() !== userId) {
      throw new ForbiddenException('You can only archive your own drafts');
    }

    const archivedDraft = await this.blogPostModel
      .findByIdAndUpdate(
        id,
        {
          status: 'archived',
          lastSavedAt: new Date(),
        },
        { new: true },
      )
      .populate('author', 'firstName lastName email')
      .exec();

    return archivedDraft;
  }

  async restoreDraft(id: string, userId: string): Promise<BlogPost> {
    const archivedPost = await this.blogPostModel.findById(id);

    if (!archivedPost) {
      throw new NotFoundException('Archived post not found');
    }

    if (archivedPost.author.toString() !== userId) {
      throw new ForbiddenException('You can only restore your own posts');
    }

    if (archivedPost.status !== 'archived') {
      throw new ForbiddenException('Can only restore archived posts');
    }

    const restoredDraft = await this.blogPostModel
      .findByIdAndUpdate(
        id,
        {
          status: 'draft',
          isDraft: true,
          lastSavedAt: new Date(),
        },
        { new: true },
      )
      .populate('author', 'firstName lastName email')
      .exec();

    return restoredDraft;
  }

  async getDraftPreview(id: string, userId: string): Promise<BlogPost> {
    const draft = await this.blogPostModel.findById(id);

    if (!draft) {
      throw new NotFoundException('Draft not found');
    }

    if (draft.author.toString() !== userId) {
      throw new ForbiddenException('You can only preview your own drafts');
    }

    return this.blogPostModel
      .findById(id)
      .populate('author', 'firstName lastName email')
      .exec();
  }

  async getScheduledPosts(): Promise<BlogPost[]> {
    return this.blogPostModel
      .find({
        status: 'draft',
        scheduledPublishAt: { $lte: new Date() },
      })
      .populate('author', 'firstName lastName email')
      .exec();
  }

  async publishScheduledPost(id: string): Promise<BlogPost> {
    const updateData = {
      status: 'published',
      isDraft: false,
      publishedAt: new Date(),
      scheduledPublishAt: undefined,
    };

    return this.blogPostModel
      .findByIdAndUpdate(new Types.ObjectId(id), updateData, { new: true })
      .populate('author', 'firstName lastName email')
      .exec();
  }

  async incrementViews(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      this.logger.warn(`Invalid ObjectId for incrementViews: ${id}`, 'BlogPostsService');
      return;
    }
    await this.blogPostModel.findByIdAndUpdate(new Types.ObjectId(id), { $inc: { views: 1 } });
  }

  async updateFeaturedImage(
    id: string,
    imageUrl: string,
    userId: string,
  ): Promise<BlogPost> {
    try {
      this.logger.debug(`Updating featured image for post: ${id} by user: ${userId}`, 'BlogPostsService');

      if (!Types.ObjectId.isValid(id)) {
        this.logger.warn(`Invalid post ID format: ${id}`, 'BlogPostsService');
        throw new NotFoundException('Blog post not found');
      }

      const post = await this.blogPostModel.findById(new Types.ObjectId(id));

      if (!post) {
        this.logger.warn(`Blog post not found for featured image update: ${id}`, 'BlogPostsService');
        throw new NotFoundException('Blog post not found');
      }

      if (post.author.toString() !== userId) {
        this.logger.logSecurity('Unauthorized featured image update attempt', {
          postId: id,
          postAuthor: post.author.toString(),
          attemptedBy: userId
        });
        throw new ForbiddenException('You can only update your own posts');
      }

      const updatedPost = await this.blogPostModel
        .findByIdAndUpdate(
          new Types.ObjectId(id),
          { featuredImage: imageUrl },
          { new: true }
        )
        .populate('author', 'firstName lastName email')
        .exec();

      this.logger.log(`Featured image updated successfully: ${id}`, 'BlogPostsService', { postId: id, userId, imageUrl });
      return updatedPost;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.logError(error, 'BlogPostsService.updateFeaturedImage', { postId: id, userId });
      throw error;
    }
  }

  async removeFeaturedImage(id: string, userId: string): Promise<BlogPost> {
    try {
      this.logger.debug(`Removing featured image for post: ${id} by user: ${userId}`, 'BlogPostsService');

      if (!Types.ObjectId.isValid(id)) {
        this.logger.warn(`Invalid post ID format: ${id}`, 'BlogPostsService');
        throw new NotFoundException('Blog post not found');
      }

      const post = await this.blogPostModel.findById(new Types.ObjectId(id));

      if (!post) {
        this.logger.warn(`Blog post not found for featured image removal: ${id}`, 'BlogPostsService');
        throw new NotFoundException('Blog post not found');
      }

      if (post.author.toString() !== userId) {
        this.logger.logSecurity('Unauthorized featured image removal attempt', {
          postId: id,
          postAuthor: post.author.toString(),
          attemptedBy: userId
        });
        throw new ForbiddenException('You can only update your own posts');
      }

      const updatedPost = await this.blogPostModel
        .findByIdAndUpdate(
          new Types.ObjectId(id),
          { $unset: { featuredImage: 1 } },
          { new: true }
        )
        .populate('author', 'firstName lastName email')
        .exec();

      this.logger.log(`Featured image removed successfully: ${id}`, 'BlogPostsService', { postId: id, userId });
      return updatedPost;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.logError(error, 'BlogPostsService.removeFeaturedImage', { postId: id, userId });
      throw error;
    }
  }

  async addAttachment(
    id: string,
    attachmentUrl: string,
    userId: string,
  ): Promise<BlogPost> {
    try {
      this.logger.debug(`Adding attachment to post: ${id} by user: ${userId}`, 'BlogPostsService');

      if (!Types.ObjectId.isValid(id)) {
        this.logger.warn(`Invalid post ID format: ${id}`, 'BlogPostsService');
        throw new NotFoundException('Blog post not found');
      }

      const post = await this.blogPostModel.findById(new Types.ObjectId(id));

      if (!post) {
        this.logger.warn(`Blog post not found for attachment addition: ${id}`, 'BlogPostsService');
        throw new NotFoundException('Blog post not found');
      }

      if (post.author.toString() !== userId) {
        this.logger.logSecurity('Unauthorized attachment addition attempt', {
          postId: id,
          postAuthor: post.author.toString(),
          attemptedBy: userId
        });
        throw new ForbiddenException('You can only update your own posts');
      }

      const updatedPost = await this.blogPostModel
        .findByIdAndUpdate(
          new Types.ObjectId(id),
          { $addToSet: { attachments: attachmentUrl } },
          { new: true }
        )
        .populate('author', 'firstName lastName email')
        .exec();

      this.logger.log(`Attachment added successfully: ${id}`, 'BlogPostsService', { postId: id, userId, attachmentUrl });
      return updatedPost;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.logError(error, 'BlogPostsService.addAttachment', { postId: id, userId });
      throw error;
    }
  }

  async removeAttachment(
    id: string,
    attachmentUrl: string,
    userId: string,
  ): Promise<BlogPost> {
    try {
      this.logger.debug(`Removing attachment from post: ${id} by user: ${userId}`, 'BlogPostsService');

      if (!Types.ObjectId.isValid(id)) {
        this.logger.warn(`Invalid post ID format: ${id}`, 'BlogPostsService');
        throw new NotFoundException('Blog post not found');
      }

      const post = await this.blogPostModel.findById(new Types.ObjectId(id));

      if (!post) {
        this.logger.warn(`Blog post not found for attachment removal: ${id}`, 'BlogPostsService');
        throw new NotFoundException('Blog post not found');
      }

      if (post.author.toString() !== userId) {
        this.logger.logSecurity('Unauthorized attachment removal attempt', {
          postId: id,
          postAuthor: post.author.toString(),
          attemptedBy: userId
        });
        throw new ForbiddenException('You can only update your own posts');
      }

      const updatedPost = await this.blogPostModel
        .findByIdAndUpdate(
          new Types.ObjectId(id),
          { $pull: { attachments: attachmentUrl } },
          { new: true }
        )
        .populate('author', 'firstName lastName email')
        .exec();

      this.logger.log(`Attachment removed successfully: ${id}`, 'BlogPostsService', { postId: id, userId, attachmentUrl });
      return updatedPost;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.logError(error, 'BlogPostsService.removeAttachment', { postId: id, userId });
      throw error;
    }
  }
}
