import { HttpContextToken } from '@angular/common/http';

/** Set to true on a request whose caller renders its own error message. */
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);
