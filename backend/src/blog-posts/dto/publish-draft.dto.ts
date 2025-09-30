import { IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class PublishDraftDto {
  @IsOptional()
  @IsDateString()
  scheduledPublishAt?: string;

  @IsOptional()
  @IsBoolean()
  publishNow?: boolean;
}
