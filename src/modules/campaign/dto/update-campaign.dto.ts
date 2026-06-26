import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  CampaignChannelDto,
  CampaignTargetGroupDto,
  CampaignTimingDto,
} from './create-campaign.dto';

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(CampaignChannelDto)
  channel?: CampaignChannelDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platforms?: string[];

  @IsOptional()
  @IsEnum(CampaignTargetGroupDto)
  targetGroup?: CampaignTargetGroupDto;

  @IsOptional()
  @IsEnum(CampaignTimingDto)
  timing?: CampaignTimingDto;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsISO8601()
  date?: string;

  @IsOptional()
  @IsBoolean()
  isScheduled?: boolean;

  @IsOptional()
  @IsBoolean()
  useGPT?: boolean;

  @IsOptional()
  @IsString()
  tone?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
