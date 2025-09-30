import { IsNotEmpty, IsString, IsOptional, IsMongoId } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsMongoId()
  @IsNotEmpty()
  blogPost: string;

  @IsOptional()
  @IsMongoId()
  parentComment?: string;
}
