import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  /**
   * Toggle like/unlike for a post or comment
   * @route POST /likes/toggle
   */
  @Post('toggle')
  @UseGuards(JwtAuthGuard)
  async toggleLike(@Body() createLikeDto: CreateLikeDto, @Request() req) {
    return this.likesService.toggleLike(createLikeDto, req.user.userId);
  }

  /**
   * Check if user has liked a post or comment
   * @route GET /likes/status?targetType=post&targetId=123
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getLikeStatus(
    @Query('targetType') targetType: string,
    @Query('targetId') targetId: string,
    @Request() req,
  ) {
    return this.likesService.getLikeStatus(targetType, targetId, req.user.userId);
  }

  /**
   * Get all likes for a specific post
   * @route GET /likes/post/:postId
   */
  @Get('post/:postId')
  async getPostLikes(@Param('postId') postId: string) {
    return this.likesService.getPostLikes(postId);
  }

  /**
   * Get all likes for a specific comment
   * @route GET /likes/comment/:commentId
   */
  @Get('comment/:commentId')
  async getCommentLikes(@Param('commentId') commentId: string) {
    return this.likesService.getCommentLikes(commentId);
  }

  /**
   * Sync likes count for a specific post
   * @route POST /likes/sync/post/:postId
   */
  @Post('sync/post/:postId')
  @UseGuards(JwtAuthGuard)
  async syncPostLikesCount(@Param('postId') postId: string) {
    return this.likesService.syncPostLikesCount(postId);
  }

  /**
   * Sync likes count for a specific comment
   * @route POST /likes/sync/comment/:commentId
   */
  @Post('sync/comment/:commentId')
  @UseGuards(JwtAuthGuard)
  async syncCommentLikesCount(@Param('commentId') commentId: string) {
    return this.likesService.syncCommentLikesCount(commentId);
  }

  /**
   * Sync all likes counts
   * @route POST /likes/sync/all
   */
  @Post('sync/all')
  @UseGuards(JwtAuthGuard)
  async syncAllLikesCount() {
    return this.likesService.syncAllLikesCount();
  }
}