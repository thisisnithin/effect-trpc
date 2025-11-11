import { Data } from 'effect';

export class NotFoundError extends Data.TaggedError('NotFoundError')<{
  message: string;
  cause?: unknown;
}> {}

export class InternalError extends Data.TaggedError('InternalError')<{
  message: string;
  cause?: unknown;
}> {}

export class ConflictError extends Data.TaggedError('ConflictError')<{
  message: string;
  cause?: unknown;
}> {}

export class UnauthorizedError extends Data.TaggedError('UnauthorizedError')<{
  message: string;
  cause?: unknown;
}> {}

export class ForbiddenError extends Data.TaggedError('ForbiddenError')<{
  message: string;
  cause?: unknown;
}> {}
