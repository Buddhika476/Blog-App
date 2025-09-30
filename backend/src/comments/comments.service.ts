import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './comment.schema';
import { BlogPost, BlogPostDocument } from '../blog-posts/blog-post.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { AppLoggerService } from '../common/logger/logger.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(BlogPost.name) private blogPostModel: Model<BlogPostDocument>,
    private logger: AppLoggerService,
  ) {}

  async create(
    createCommentDto: CreateCommentDto,
    userId: string,
  ): Promise<Comment> {
    try {
      this.logger.debug(
        `Creating comment on post: ${createCommentDto.blogPost} by user: ${userId}`,
        'CommentsService'
      );

      // Validate ObjectIds
      if (!Types.ObjectId.isValid(userId)) {
        this.logger.warn(`Invalid user ID format: ${userId}`, 'CommentsService');
        throw new Error('Invalid user ID format');
      }
      if (!Types.ObjectId.isValid(createCommentDto.blogPost)) {
        this.logger.warn(`Invalid blog post ID format: ${createCommentDto.blogPost}`, 'CommentsService');
        throw new Error('Invalid blog post ID format');
      }
      if (createCommentDto.parentComment && !Types.ObjectId.isValid(createCommentDto.parentComment)) {
        this.logger.warn(`Invalid parent comment ID format: ${createCommentDto.parentComment}`, 'CommentsService');
        throw new Error('Invalid parent comment ID format');
      }

      // Verify blog post exists
      const blogPost = await this.blogPostModel.findById(
        new Types.ObjectId(createCommentDto.blogPost),
      );
      if (!blogPost) {
        this.logger.warn(`Blog post not found for comment: ${createCommentDto.blogPost}`, 'CommentsService');
        throw new NotFoundException('Blog post not found');
      }

      // If it's a reply, verify parent comment exists and belongs to the same post
      if (createCommentDto.parentComment) {
        this.logger.debug(
          `Creating reply to comment: ${createCommentDto.parentComment}`,
          'CommentsService'
        );

        const parentComment = await this.commentModel.findById(
          new Types.ObjectId(createCommentDto.parentComment),
        );
        if (!parentComment) {
          this.logger.warn(`Parent comment not found: ${createCommentDto.parentComment}`, 'CommentsService');
          throw new NotFoundException('Parent comment not found');
        }
        if (parentComment.blogPost.toString() !== createCommentDto.blogPost) {
          this.logger.logSecurity('Comment parent mismatch attempt', {
            parentId: createCommentDto.parentComment,
            parentPostId: parentComment.blogPost.toString(),
            requestedPostId: createCommentDto.blogPost,
            userId
          });
          throw new ForbiddenException(
            'Parent comment does not belong to this blog post',
          );
        }
      }

      const commentData = {
        content: createCommentDto.content,
        author: new Types.ObjectId(userId),
        blogPost: new Types.ObjectId(createCommentDto.blogPost),
        parentComment: createCommentDto.parentComment ? new Types.ObjectId(createCommentDto.parentComment) : null,
      };

      const comment = new this.commentModel(commentData);

      const savedComment = await comment.save();

      // If it's a reply, add it to parent's replies
      if (createCommentDto.parentComment) {
        await this.commentModel.findByIdAndUpdate(
          new Types.ObjectId(createCommentDto.parentComment),
          { $push: { replies: savedComment._id } },
        );
      }

      // Update blog post comments count
      await this.blogPostModel.findByIdAndUpdate(new Types.ObjectId(createCommentDto.blogPost), {
        $inc: { commentsCount: 1 },
      });

      this.logger.log(
        `Comment created successfully: ${savedComment._id}`,
        'CommentsService',
        {
          commentId: savedComment._id,
          postId: createCommentDto.blogPost,
          userId,
          isReply: !!createCommentDto.parentComment
        }
      );

      return savedComment.populate('author', 'firstName lastName email');
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.logError(error, 'CommentsService.create', {
        postId: createCommentDto.blogPost,
        userId,
        parentComment: createCommentDto.parentComment
      });
      throw error;
    }
  }

  async findByBlogPost(
    blogPostId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ comments: Comment[]; total: number }> {
    if (!Types.ObjectId.isValid(blogPostId)) {
      this.logger.warn(`Invalid blog post ID format: ${blogPostId}`, 'CommentsService');
      return { comments: [], total: 0 };
    }

    const skip = (page - 1) * limit;

    // Get top-level comments (no parent)
    const comments = await this.commentModel
      .find({
        blogPost: new Types.ObjectId(blogPostId),
        parentComment: null,
        isDeleted: false,
      })
      .populate('author', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Recursively populate all nested replies
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const commentObj = comment.toObject();
        commentObj.replies = await this.getNestedReplies(comment._id.toString());
        return commentObj;
      })
    );

    const total = await this.commentModel.countDocuments({
      blogPost: new Types.ObjectId(blogPostId),
      parentComment: null,
      isDeleted: false,
    });

    return { comments: commentsWithReplies, total };
  }

  private async getNestedReplies(commentId: string): Promise<any[]> {
    const replies = await this.commentModel
      .find({
        parentComment: new Types.ObjectId(commentId),
        isDeleted: false,
      })
      .populate('author', 'firstName lastName email')
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    // Recursively get replies for each reply
    const repliesWithNested = await Promise.all(
      replies.map(async (reply: any) => {
        reply.replies = await this.getNestedReplies(reply._id.toString());
        return reply;
      })
    );

    return repliesWithNested;
  }

  async findReplies(commentId: string): Promise<Comment[]> {
    if (!Types.ObjectId.isValid(commentId)) {
      this.logger.warn(`Invalid comment ID format: ${commentId}`, 'CommentsService');
      throw new NotFoundException('Comment not found');
    }

    const comment = await this.commentModel.findById(new Types.ObjectId(commentId));
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return this.commentModel
      .find({
        parentComment: new Types.ObjectId(commentId),
        isDeleted: false,
      })
      .populate('author', 'firstName lastName email')
      .sort({ createdAt: 1 })
      .exec();
  }

  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
    userId: string,
  ): Promise<Comment> {
    try {
      this.logger.debug(`Updating comment: ${id} by user: ${userId}`, 'CommentsService');

      if (!Types.ObjectId.isValid(id)) {
        this.logger.warn(`Invalid comment ID format: ${id}`, 'CommentsService');
        throw new NotFoundException('Comment not found');
      }
      if (!Types.ObjectId.isValid(userId)) {
        this.logger.warn(`Invalid user ID format: ${userId}`, 'CommentsService');
        throw new Error('Invalid user ID format');
      }

      const comment = await this.commentModel.findById(new Types.ObjectId(id));

      if (!comment) {
        this.logger.warn(`Comment not found for update: ${id}`, 'CommentsService');
        throw new NotFoundException('Comment not found');
      }

      if (comment.author.toString() !== userId) {
        this.logger.logSecurity('Unauthorized comment update attempt', {
          commentId: id,
          commentAuthor: comment.author.toString(),
          attemptedBy: userId
        });
        throw new ForbiddenException('You can only update your own comments');
      }

      if (comment.isDeleted) {
        this.logger.warn(`Attempted to update deleted comment: ${id}`, 'CommentsService');
        throw new ForbiddenException('Cannot update deleted comment');
      }

      const updatedComment = await this.commentModel
        .findByIdAndUpdate(new Types.ObjectId(id), updateCommentDto, { new: true })
        .populate('author', 'firstName lastName email')
        .exec();

      this.logger.log(`Comment updated successfully: ${id}`, 'CommentsService', { commentId: id, userId });
      return updatedComment;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.logError(error, 'CommentsService.update', { commentId: id, userId });
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      this.logger.debug(`Deleting comment: ${id} by user: ${userId}`, 'CommentsService');

      if (!Types.ObjectId.isValid(id)) {
        this.logger.warn(`Invalid comment ID format: ${id}`, 'CommentsService');
        throw new NotFoundException('Comment not found');
      }
      if (!Types.ObjectId.isValid(userId)) {
        this.logger.warn(`Invalid user ID format: ${userId}`, 'CommentsService');
        throw new Error('Invalid user ID format');
      }

      const comment = await this.commentModel.findById(new Types.ObjectId(id));

      if (!comment) {
        this.logger.warn(`Comment not found for deletion: ${id}`, 'CommentsService');
        throw new NotFoundException('Comment not found');
      }

      if (comment.author.toString() !== userId) {
        this.logger.logSecurity('Unauthorized comment deletion attempt', {
          commentId: id,
          commentAuthor: comment.author.toString(),
          attemptedBy: userId
        });
        throw new ForbiddenException('You can only delete your own comments');
      }

      // Soft delete the comment
      await this.commentModel.findByIdAndUpdate(new Types.ObjectId(id), {
        isDeleted: true,
        content: '[Comment deleted]',
      });

      // Update blog post comments count
      await this.blogPostModel.findByIdAndUpdate(comment.blogPost, {
        $inc: { commentsCount: -1 },
      });

      this.logger.log(`Comment deleted successfully: ${id}`, 'CommentsService', {
        commentId: id,
        userId,
        postId: comment.blogPost.toString()
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.logError(error, 'CommentsService.remove', { commentId: id, userId });
      throw error;
    }
  }

}
