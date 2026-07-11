import { Injectable } from '@nestjs/common';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadsService {
  private readonly imagesPath = 'uploads/images/supplies';
  private readonly videosPath = 'uploads/videos/supplies';

  constructor() {
    this.ensureDirectoriesExist();
  }

  private ensureDirectoriesExist(): void {
    if (!existsSync(this.imagesPath)) {
      mkdirSync(this.imagesPath, { recursive: true });
    }
    if (!existsSync(this.videosPath)) {
      mkdirSync(this.videosPath, { recursive: true });
    }
  }

  getImagesPath(): string {
    return this.imagesPath;
  }

  getVideosPath(): string {
    return this.videosPath;
  }

  getFileUrl(filename: string, type: 'images' | 'videos'): string {
    const basePath = type === 'images' ? this.imagesPath : this.videosPath;
    return `/api/${basePath}/${filename}`;
  }
}
