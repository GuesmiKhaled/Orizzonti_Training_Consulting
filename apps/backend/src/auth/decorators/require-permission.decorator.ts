import { SetMetadata } from '@nestjs/common';
import { REQUIRED_PERMISSION_KEY } from '../auth.constants';

export const RequirePermission = (permission: string | string[]) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permission);
