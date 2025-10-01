import { IsNotEmpty, IsMongoId, IsIn, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLikeDto {
  @ApiProperty({
    description: 'Blog post ID (required when targetType is "post")',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @ValidateIf((o) => o.targetType === 'post')
  @IsNotEmpty({ message: 'blogPost is required when targetType is post' })
  @IsMongoId({ message: 'blogPost must be a valid MongoDB ID' })
  blogPost?: string;

  @ApiProperty({
    description: 'Comment ID (required when targetType is "comment")',
    example: '507f1f77bcf86cd799439012',
    required: false,
  })
  @ValidateIf((o) => o.targetType === 'comment')
  @IsNotEmpty({ message: 'comment is required when targetType is comment' })
  @IsMongoId({ message: 'comment must be a valid MongoDB ID' })
  comment?: string;

  @ApiProperty({
    description: 'Target type - whether liking a post or comment',
    example: 'post',
    enum: ['post', 'comment'],
    required: true,
  })
  @IsNotEmpty({ message: 'targetType is required' })
  @IsIn(['post', 'comment'], { message: 'targetType must be either post or comment' })
  targetType: 'post' | 'comment';
}