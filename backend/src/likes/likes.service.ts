import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Like, LikeDocument } from './like.schema';
import { BlogPost, BlogPostDocument } from '../blog-posts/blog-post.schema';
import { Comment, CommentDocument } from '../comments/comment.schema';
import { CreateLikeDto } from './dto/create-like.dto';

@Injectable()
export class LikesService {
  constructor(
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    @InjectModel(BlogPost.name) private blogPostModel: Model<BlogPostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  /**
   * Toggle like/unlike for a post or comment
   */
  async toggleLike(
    createLikeDto: CreateLikeDto,
    userId: string,
  ): Promise<{ liked: boolean; count: number; message: string }> {
    const { targetType, blogPost, comment } = createLikeDto;
    const targetId = targetType === 'post' ? blogPost : comment;

    if (!targetId) {
      throw new BadRequestException(`${targetType} ID is required`);
    }

    // Validate and get target document
    const target = await this.validateAndGetTarget(targetType, targetId);
    if (!target) {
      throw new NotFoundException(`${targetType} not found`);
    }

    // Build query
    const query = this.buildQuery(userId, targetType, targetId);

    // Check if like exists
    const existingLike = await this.likeModel.findOne(query).lean();

    if (existingLike) {
      // Unlike: remove like and decrement count
      await this.likeModel.deleteOne({ _id: existingLike._id });
      await this.updateLikeCount(targetType, targetId, -1);

      const count = await this.getLikeCount(targetType, targetId);
      return { liked: false, count, message: 'Like removed' };
    } else {
      // Like: create like and increment count
      try {
        await this.likeModel.create({
          user: new Types.ObjectId(userId),
          targetType,
          ...(targetType === 'post' ? { blogPost: new Types.ObjectId(targetId) } : { comment: new Types.ObjectId(targetId) }),
        });

        await this.updateLikeCount(targetType, targetId, 1);

        const count = await this.getLikeCount(targetType, targetId);
        return { liked: true, count, message: 'Like added' };
      } catch (error: any) {
        // Handle duplicate key error (race condition)
        if (error.code === 11000) {
          const count = await this.getLikeCount(targetType, targetId);
          return { liked: true, count, message: 'Already liked' };
        }
        throw error;
      }
    }
  }

  /**
   * Get like status for a user
   */
  async getLikeStatus(
    targetType: string,
    targetId: string,
    userId: string,
  ): Promise<{ liked: boolean }> {
    const query = this.buildQuery(userId, targetType, targetId);
    const like = await this.likeModel.findOne(query).lean();
    return { liked: !!like };
  }

  /**
   * Get all likes for a post
   */
  async getPostLikes(postId: string): Promise<{ likes: Like[]; count: number }> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID');
    }

    const likes = await this.likeModel
      .find({ blogPost: new Types.ObjectId(postId), targetType: 'post' })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    return { likes, count: likes.length };
  }

  /**
   * Get all likes for a comment
   */
  async getCommentLikes(commentId: string): Promise<{ likes: Like[]; count: number }> {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('Invalid comment ID');
    }

    const likes = await this.likeModel
      .find({ comment: new Types.ObjectId(commentId), targetType: 'comment' })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    return { likes, count: likes.length };
  }

  /**
   * Sync likes count for a specific post
   */
  async syncPostLikesCount(postId: string): Promise<{ count: number; synced: boolean }> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID');
    }

    const actualCount = await this.likeModel.countDocuments({
      blogPost: new Types.ObjectId(postId),
      targetType: 'post',
    });

    await this.blogPostModel.findByIdAndUpdate(postId, { likesCount: actualCount });

    return { count: actualCount, synced: true };
  }

  /**
   * Sync likes count for a specific comment
   */
  async syncCommentLikesCount(commentId: string): Promise<{ count: number; synced: boolean }> {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('Invalid comment ID');
    }

    const actualCount = await this.likeModel.countDocuments({
      comment: new Types.ObjectId(commentId),
      targetType: 'comment',
    });

    await this.commentModel.findByIdAndUpdate(commentId, { likesCount: actualCount });

    return { count: actualCount, synced: true };
  }

  /**
   * Sync all likes counts
   */
  async syncAllLikesCount(): Promise<{ postsFixed: number; commentsFixed: number }> {
    let postsFixed = 0;
    let commentsFixed = 0;

    // Sync all posts
    const posts = await this.blogPostModel.find({}, '_id likesCount').lean();
    for (const post of posts) {
      const actualCount = await this.likeModel.countDocuments({
        blogPost: post._id,
        targetType: 'post',
      });

      if (post.likesCount !== actualCount) {
        await this.blogPostModel.findByIdAndUpdate(post._id, { likesCount: actualCount });
        postsFixed++;
      }
    }

    // Sync all comments
    const comments = await this.commentModel.find({}, '_id likesCount').lean();
    for (const comment of comments) {
      const actualCount = await this.likeModel.countDocuments({
        comment: comment._id,
        targetType: 'comment',
      });

      if (comment.likesCount !== actualCount) {
        await this.commentModel.findByIdAndUpdate(comment._id, { likesCount: actualCount });
        commentsFixed++;
      }
    }

    return { postsFixed, commentsFixed };
  }

  // Private helper methods

  private buildQuery(userId: string, targetType: string, targetId: string) {
    const query: any = {
      user: new Types.ObjectId(userId),
      targetType,
    };

    if (targetType === 'post') {
      query.blogPost = new Types.ObjectId(targetId);
    } else {
      query.comment = new Types.ObjectId(targetId);
    }

    return query;
  }

  private async validateAndGetTarget(targetType: string, targetId: string) {
    if (!Types.ObjectId.isValid(targetId)) {
      throw new BadRequestException(`Invalid ${targetType} ID format`);
    }

    if (targetType === 'post') {
      return await this.blogPostModel.findById(targetId).lean();
    } else {
      return await this.commentModel.findById(targetId).lean();
    }
  }

  private async updateLikeCount(targetType: string, targetId: string, increment: number) {
    if (targetType === 'post') {
      await this.blogPostModel.findByIdAndUpdate(targetId, { $inc: { likesCount: increment } });
    } else {
      await this.commentModel.findByIdAndUpdate(targetId, { $inc: { likesCount: increment } });
    }
  }

  private async getLikeCount(targetType: string, targetId: string): Promise<number> {
    const query: any = { targetType };

    if (targetType === 'post') {
      query.blogPost = new Types.ObjectId(targetId);
    } else {
      query.comment = new Types.ObjectId(targetId);
    }

    return await this.likeModel.countDocuments(query);
  }
}