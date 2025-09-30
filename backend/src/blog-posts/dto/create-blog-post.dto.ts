import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreateBlogPostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  excerpt: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: string;

  @IsString()
  @IsOptional()
  featuredImage?: string;

  @IsOptional()
  scheduledPublishAt?: Date;
}
