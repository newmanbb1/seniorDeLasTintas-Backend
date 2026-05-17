import { Controller, Post, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeedService } from './seed.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { AllowAnonymous } from '../../common/guards/allow-anon.decorator';

@ApiTags('seed')
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post('all')
  @AllowAnonymous()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ejecutar seed completo' })
  async seedAll() {
    const result = await this.seedService.seedAll();
    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  }

  @Post('reset')
  @AllowAnonymous()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Limpiar datos y ejecutar seed' })
  async resetAndSeed() {
    const result = await this.seedService.resetAndSeed();
    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  }

  @Get('status')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Verificar estado del seed' })
  async getStatus() {
    const result = await this.seedService.getStatus();
    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  }
}