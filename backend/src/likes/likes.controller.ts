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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Likes')
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('toggle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle like/unlike for a post or comment' })
  @ApiResponse({ status: 200, description: 'Like toggled successfully' })
  async toggleLike(@Body() createLikeDto: CreateLikeDto, @Request() req) {
    return this.likesService.toggleLike(createLikeDto, req.user.userId);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Check if user has liked a post or comment' })
  @ApiQuery({ name: 'targetType', required: true, type: String })
  @ApiQuery({ name: 'targetId', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Return like status' })
  async getLikeStatus(
    @Query('targetType') targetType: string,
    @Query('targetId') targetId: string,
    @Request() req,
  ) {
    return this.likesService.getLikeStatus(targetType, targetId, req.user.userId);
  }

  @Get('post/:postId')
  @ApiOperation({ summary: 'Get all likes for a specific post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Return post likes' })
  async getPostLikes(@Param('postId') postId: string) {
    return this.likesService.getPostLikes(postId);
  }

  @Get('comment/:commentId')
  @ApiOperation({ summary: 'Get all likes for a specific comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Return comment likes' })
  async getCommentLikes(@Param('commentId') commentId: string) {
    return this.likesService.getCommentLikes(commentId);
  }

  @Post('sync/post/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Sync likes count for a specific post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post likes count synced successfully' })
  async syncPostLikesCount(@Param('postId') postId: string) {
    return this.likesService.syncPostLikesCount(postId);
  }

  @Post('sync/comment/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Sync likes count for a specific comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment likes count synced successfully' })
  async syncCommentLikesCount(@Param('commentId') commentId: string) {
    return this.likesService.syncCommentLikesCount(commentId);
  }

  @Post('sync/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Sync all likes counts' })
  @ApiResponse({ status: 200, description: 'All likes counts synced successfully' })
  async syncAllLikesCount() {
    return this.likesService.syncAllLikesCount();
  }
}