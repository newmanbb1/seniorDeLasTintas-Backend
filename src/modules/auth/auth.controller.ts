import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { LoginPinDto } from './dto/login-pin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AllowAnonymous } from '../../common/guards/allow-anon.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @AllowAnonymous()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nuevo administrador (solo primer registro)' })
  async register(@Body() dto: RegisterAdminDto) {
    const result = await this.authService.register(dto);
    return {
      success: true,
      data: result,
      message: 'Administrador registrado correctamente',
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
  @AllowAnonymous()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de empleado (solo PIN)' })
  async loginPin(@Body() dto: LoginPinDto) {
    const result = await this.authService.loginPin(dto);
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
  async logout(@Request() req: any) {
    const result = await this.authService.logout(req.user.sub);
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
  async getProfile(@Request() req: any) {
    const result = await this.authService.getProfile(req.user.sub);
    return {
      success: true,
      data: result,
      message: 'Perfil obtenido correctamente',
    };
  }
}