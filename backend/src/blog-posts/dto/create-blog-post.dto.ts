import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBlogPostDto {
  @ApiProperty({
    description: 'Blog post title',
    example: 'My First Blog Post',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Blog post content (supports markdown)',
    example: 'This is the full content of my blog post...',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Short excerpt or summary of the blog post',
    example: 'A brief introduction to my blog post',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  excerpt: string;

  @ApiProperty({
    description: 'Array of tags for categorizing the post',
    example: ['technology', 'programming', 'javascript'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    description: 'Post status',
    example: 'published',
    enum: ['draft', 'published', 'archived'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: string;

  @ApiProperty({
    description: 'URL of the featured image',
    example: '/uploads/image-123.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  featuredImage?: string;

  @ApiProperty({
    description: 'Schedule post to be published at a specific date/time',
    example: '2025-12-31T23:59:59.000Z',
    required: false,
    type: Date,
  })
  @IsOptional()
  scheduledPublishAt?: Date;
}
