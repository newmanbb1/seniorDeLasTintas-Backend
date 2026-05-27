import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiErrorItemDto } from './api-error-item.dto';

export class ApiSuccessResponseDto {
  @ApiProperty({ example: true })
  success: true;

  @ApiPropertyOptional({
    description: 'Payload when the request succeeds (shape varies by endpoint)',
    type: 'object',
    additionalProperties: true,
  })
  data?: unknown;

  @ApiPropertyOptional({ example: 'Created successfully' })
  message?: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: false;

  @ApiProperty({ example: 'Validation failed' })
  message: string;

  @ApiPropertyOptional({ type: [ApiErrorItemDto] })
  errors?: ApiErrorItemDto[];
}
