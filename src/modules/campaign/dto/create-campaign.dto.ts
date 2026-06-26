import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export enum CampaignChannelDto {
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
}

export enum CampaignTimingDto {
  SEVEN_DAYS = 'SEVEN_DAYS',
  THREE_WEEKS = 'THREE_WEEKS',
  ONE_MONTH = 'ONE_MONTH',
  CUSTOM = 'CUSTOM',
}

export enum CampaignTargetGroupDto {
  ALL = 'all',
  RECENT = 'recent',
  VIP = 'vip',
  HAS_NO_REVIEW = 'hasNoReview',
  POSITIVE_ONLY = 'positiveOnly',
  ALL_NO_REVIEW = 'allNoReview',
  PAST_WEEK_NO_REVIEW = 'pastWeekNoReview',
  PAST_MONTH_NO_REVIEW = 'pastMonthNoReview',
}

export class CreateCampaignDto {
  @IsString()
  @MinLength(1)
  name: string;

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

  // Required when useGPT is true
  @ValidateIf((o: CreateCampaignDto) => o.useGPT === true)
  @IsString()
  @MinLength(1, { message: 'Tone is required when using GPT.' })
  tone?: string;

  // Required when useGPT is false/undefined
  @ValidateIf((o: CreateCampaignDto) => !o.useGPT)
  @IsString()
  @MinLength(1, { message: 'Message is required when not using GPT.' })
  message?: string;

  @IsOptional()
  @IsEnum(['draft', 'pending', 'sent', 'paused'])
  status?: 'draft' | 'pending' | 'sent' | 'paused';
}
