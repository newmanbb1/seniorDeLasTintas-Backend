import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { RegisterSecretariaDto } from './dto/register-secretaria.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { LoginPinDto } from './dto/login-pin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AllowAnonymous } from '../../common/guards/allow-anon.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, GetUser } from '../../common/decorators';
import { UserRole } from './entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @AllowAnonymous()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar nuevo administrador (solo primer registro)',
  })
  async register(@Body() dto: RegisterAdminDto) {
    const result = await this.authService.register(dto);
    return {
      success: true,
      data: result,
      message: 'Administrador registrado correctamente',
    };
  }

  @Post('register-secretaria')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nueva secretaria (solo admin)' })
  @ApiBody({ type: RegisterSecretariaDto })
  async registerSecretaria(
    @Body() dto: RegisterSecretariaDto,
    @GetUser('id') adminUserId: string,
  ) {
    const result = await this.authService.registerSecretaria(dto, adminUserId);
    return {
      success: true,
      data: result,
      message: 'Secretaria registrada correctamente',
    };
  }

  @Post('login')
  @AllowAnonymous()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de administrador (email + password)' })
  async login(@Body() dto: LoginAdminDto) {
    const result = await this.authService.login(dto);
    return {
      success: true,
      data: result,
      message: 'Login exitoso',
    };
  }

  @Post('login-pin')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @AllowAnonymous()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de empleado (solo PIN)' })
  async loginPin(@Body() dto: LoginPinDto, @Req() req: Request) {
    const clientIp = req.ip;
    const result = await this.authService.loginPin(dto, clientIp);
    return {
      success: true,
      data: result,
      message: 'Login de empleado exitoso',
    };
  }

  @Post('refresh')
  @AllowAnonymous()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token con refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refresh(dto.refresh_token);
    return {
      success: true,
      data: result,
      message: 'Token renovado correctamente',
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión (revocar refresh token)' })
  async logout(@Req() req: any) {
    const result = await this.authService.logout(req.user.id);
    return {
      success: true,
      data: result,
      message: result.message,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario actual' })
  async getProfile(@Req() req: any) {
    const result = await this.authService.getProfile(req.user.id);
    return {
      success: true,
      data: result,
      message: 'Perfil obtenido correctamente',
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar usuario (admin only)' })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @GetUser('id') userId: string,
  ) {
    const result = await this.authService.updateUser(id, dto, userId);
    return {
      success: true,
      data: result,
      message: 'Usuario actualizado correctamente',
    };
  }

  @Get('secretarias')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas las secretarias (solo admin)' })
  async findAllSecretarias(@Req() req: any) {
    const { limit, offset, branch_id, active } = req.query;
    const result = await this.authService.findAllSecretarias(
      limit ? parseInt(limit) : 10,
      offset ? parseInt(offset) : 0,
      branch_id,
      active !== undefined ? active === 'true' : undefined,
    );
    return {
      success: true,
      data: result,
      message: 'Secretarias obtenidas correctamente',
    };
  }
}
