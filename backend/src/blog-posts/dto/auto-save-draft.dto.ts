import { IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AutoSaveDraftDto {
  @ApiProperty({
    description: 'Draft title',
    example: 'My Draft Title',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Draft content',
    example: 'This is my draft content...',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    description: 'Draft excerpt',
    example: 'A brief summary',
    required: false,
  })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiProperty({
    description: 'Draft tags',
    example: ['tech', 'blog'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  tags?: string[];
}
