import { SetMetadata } from '@nestjs/common';
import { ALLOW_PENDING_PASSWORD_CHANGE_KEY } from '../auth.constants';

/** Marks an endpoint that stays usable while the account must change its password. */
export const AllowPendingPasswordChange = () =>
  SetMetadata(ALLOW_PENDING_PASSWORD_CHANGE_KEY, true);
