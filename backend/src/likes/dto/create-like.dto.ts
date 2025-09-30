import { IsNotEmpty, IsMongoId, IsIn, ValidateIf } from 'class-validator';

export class CreateLikeDto {
  @ValidateIf((o) => o.targetType === 'post')
  @IsNotEmpty({ message: 'blogPost is required when targetType is post' })
  @IsMongoId({ message: 'blogPost must be a valid MongoDB ID' })
  blogPost?: string;

  @ValidateIf((o) => o.targetType === 'comment')
  @IsNotEmpty({ message: 'comment is required when targetType is comment' })
  @IsMongoId({ message: 'comment must be a valid MongoDB ID' })
  comment?: string;

  @IsNotEmpty({ message: 'targetType is required' })
  @IsIn(['post', 'comment'], { message: 'targetType must be either post or comment' })
  targetType: 'post' | 'comment';
}