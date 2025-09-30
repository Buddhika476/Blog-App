import { IsOptional, IsString, IsArray } from 'class-validator';

export class CreateDraftDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}
