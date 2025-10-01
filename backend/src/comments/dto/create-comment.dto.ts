import { IsNotEmpty, IsString, IsOptional, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Comment content',
    example: 'Great post! Thanks for sharing.',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Blog post ID (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
    required: true,
  })
  @IsMongoId()
  @IsNotEmpty()
  blogPost: string;

  @ApiProperty({
    description: 'Parent comment ID for replies (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439012',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  parentComment?: string;
}
