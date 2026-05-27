import { SetMetadata } from '@nestjs/common';

export const ALLOW_ANON_KEY = 'allowAnonymous';
export const AllowAnonymous = () => SetMetadata(ALLOW_ANON_KEY, true);
