import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { detectImageType } from './detect-image-type';
import { getUploadDir } from './upload-dir';

/** The subset of a multer memory-storage file this service uses. */
export interface UploadedImage {
  buffer: Buffer;
  size: number;
}

@Injectable()
export class MediaUploadService {
  /** Validates the file content, stores it under a random name and returns that name. */
  async save(file: UploadedImage): Promise<string> {
    const type = detectImageType(file.buffer);
    if (!type) {
      throw new BadRequestException(
        'Only JPEG, PNG, WebP and GIF images are allowed',
      );
    }
    const directory = getUploadDir();
    await mkdir(directory, { recursive: true });
    const name = `${randomUUID()}.${type.ext}`;
    await writeFile(join(directory, name), file.buffer, { flag: 'wx' });
    return name;
  }
}
