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
import {
  createReadStream,
  existsSync,
  openSync,
  readSync,
  closeSync,
  unlinkSync,
} from 'fs';
import { join } from 'path';
import { UploadsService } from './uploads.service';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';
import { AllowAnonymous } from '../../common/guards/allow-anon.decorator';
import { UserRole } from '../auth/entities/user.entity';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const MAGIC: Record<string, (buffer: Buffer) => boolean> = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) =>
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  'image/webp': (b) => b.slice(8, 12).toString() === 'WEBP',
  'image/gif': (b) =>
    b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
  'video/mp4': (b) => b.slice(4, 8).toString() === 'ftyp',
  'video/webm': (b) =>
    b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
  'video/quicktime': (b) => b.slice(4, 8).toString() === 'ftyp',
};

function validateFileType(filePath: string, mimetype: string): boolean {
  const validator = MAGIC[mimetype];
  if (!validator) return false;
  const fd = openSync(filePath, 'r');
  const buffer = Buffer.alloc(12);
  readSync(fd, buffer, 0, 12, 0);
  closeSync(fd);
  return validator(buffer);
}

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
      unlinkSync(file.path);
      throw new BadRequestException(
        'Tipo de archivo no permitido. Tipos permitidos: jpeg, png, webp, gif',
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      unlinkSync(file.path);
      throw new BadRequestException(
        'El archivo supera el tamaño máximo de 5MB',
      );
    }

    if (!validateFileType(file.path, file.mimetype)) {
      unlinkSync(file.path);
      throw new BadRequestException(
        'El archivo no coincide con el formato esperado',
      );
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
      unlinkSync(file.path);
      throw new BadRequestException(
        'Tipo de archivo no permitido. Tipos permitidos: mp4, webm, mov',
      );
    }

    if (file.size > MAX_VIDEO_SIZE) {
      unlinkSync(file.path);
      throw new BadRequestException(
        'El archivo supera el tamaño máximo de 50MB',
      );
    }

    if (!validateFileType(file.path, file.mimetype)) {
      unlinkSync(file.path);
      throw new BadRequestException(
        'El archivo no coincide con el formato esperado',
      );
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
    const safeName = this.sanitizeFilename(filename);
    const filePath = join(this.uploadsService.getImagesPath(), safeName);

    if (!existsSync(filePath)) {
      throw new BadRequestException('Imagen no encontrada');
    }

    const file = createReadStream(filePath);
    res.set({
      'Content-Type': this.getMimeType(safeName),
      'Content-Disposition': `inline; filename="${safeName}"`,
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
    const safeName = this.sanitizeFilename(filename);
    const filePath = join(this.uploadsService.getVideosPath(), safeName);

    if (!existsSync(filePath)) {
      throw new BadRequestException('Video no encontrado');
    }

    const file = createReadStream(filePath);
    res.set({
      'Content-Type': this.getMimeType(safeName),
      'Content-Disposition': `inline; filename="${safeName}"`,
    });

    return new StreamableFile(file);
  }

  private sanitizeFilename(filename: string): string {
    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '');
    return sanitized || '_';
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
