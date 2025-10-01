import { IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDraftDto {
  @ApiProperty({
    description: 'Draft title (optional)',
    example: 'Untitled Draft',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Draft content (optional)',
    example: 'Work in progress...',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    description: 'Draft excerpt (optional)',
    example: 'Brief summary',
    required: false,
  })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiProperty({
    description: 'Draft tags (optional)',
    example: ['draft', 'wip'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  tags?: string[];
}
