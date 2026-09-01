import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterConversation extends PaginationDto {}

export class FilterConversationMessage extends PaginationDto {
  @ApiPropertyOptional({
    description: 'If true, returns the most recent messages (for chat inbox)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  latest?: boolean;
}
