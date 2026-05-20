import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Get,
  Param,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { UploadsService } from './uploads.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';
import { AllowAnonymous } from '../../common/guards/allow-anon.decorator';
import { UserRole } from '../auth/entities/user.entity';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subir imagen (Admin o Secretaria)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de archivo no permitido. Tipos permitidos: jpeg, png, webp, gif',
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException('El archivo supera el tamaño máximo de 5MB');
    }

    const filename = file.filename;
    const url = this.uploadsService.getFileUrl(filename, 'images');

    return {
      filename,
      url,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Post('videos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subir video (Admin o Secretaria)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    if (!ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de archivo no permitido. Tipos permitidos: mp4, webm, mov',
      );
    }

    if (file.size > MAX_VIDEO_SIZE) {
      throw new BadRequestException('El archivo supera el tamaño máximo de 50MB');
    }

    const filename = file.filename;
    const url = this.uploadsService.getFileUrl(filename, 'videos');

    return {
      filename,
      url,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Get('images/supplies/:filename')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Ver imagen de supply' })
  async getImage(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const filePath = join(this.uploadsService.getImagesPath(), filename);

    if (!existsSync(filePath)) {
      throw new BadRequestException('Imagen no encontrada');
    }

    const file = createReadStream(filePath);
    res.set({
      'Content-Type': this.getMimeType(filename),
      'Content-Disposition': `inline; filename="${filename}"`,
    });

    return new StreamableFile(file);
  }

  @Get('videos/supplies/:filename')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Ver video de supply' })
  async getVideo(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const filePath = join(this.uploadsService.getVideosPath(), filename);

    if (!existsSync(filePath)) {
      throw new BadRequestException('Video no encontrado');
    }

    const file = createReadStream(filePath);
    res.set({
      'Content-Type': this.getMimeType(filename),
      'Content-Disposition': `inline; filename="${filename}"`,
    });

    return new StreamableFile(file);
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}