import { BadRequestException, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

const EXT_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

const IMAGES_DIR = 'uploads/images/supplies';
const VIDEOS_DIR = 'uploads/videos/supplies';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, callback) => {
          const isVideo = file.mimetype.startsWith('video/');
          const dest = isVideo ? VIDEOS_DIR : IMAGES_DIR;
          mkdirSync(dest, { recursive: true });
          callback(null, dest);
        },
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = EXT_MAP[file.mimetype] || '.bin';
          const filename = `${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
      fileFilter: (req, file, callback) => {
        if (!EXT_MAP[file.mimetype]) {
          return callback(
            new BadRequestException('Tipo de archivo no permitido'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
