import { IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PublishDraftDto {
  @ApiProperty({
    description: 'Schedule the draft to be published at a specific date/time',
    example: '2025-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledPublishAt?: string;

  @ApiProperty({
    description: 'Publish the draft immediately',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  publishNow?: boolean;
}
