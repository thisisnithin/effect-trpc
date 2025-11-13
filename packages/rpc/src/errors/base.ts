import { Schema as S } from 'effect';

export class InternalError extends S.TaggedError<InternalError>()(
  'InternalError',
  {
    message: S.String,
  },
) {}
