import { TRPCError } from '@trpc/server';
import type { TRPC_ERROR_CODE_KEY } from '@trpc/server/rpc';
import { Cause, Effect, Runtime } from 'effect';
import {
  ConflictError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  UnauthorizedError,
} from '../errors/base.js';

type AppError =
  | NotFoundError
  | ConflictError
  | UnauthorizedError
  | ForbiddenError
  | InternalError;

function mapErrorToTRPCCode(error: AppError): TRPC_ERROR_CODE_KEY {
  switch (error._tag) {
    case 'NotFoundError':
      return 'NOT_FOUND';
    case 'ConflictError':
      return 'CONFLICT';
    case 'UnauthorizedError':
      return 'UNAUTHORIZED';
    case 'ForbiddenError':
      return 'FORBIDDEN';
    case 'InternalError':
      return 'INTERNAL_SERVER_ERROR';
  }
}

export async function runEffectInTRPC<A, E, R>(
  runtime: Runtime.Runtime<R>,
  effect: Effect.Effect<A, E, R>,
): Promise<A> {
  const exit = await Runtime.runPromiseExit(runtime)(effect);

  if (exit._tag === 'Success') {
    return exit.value;
  }

  const failure = Cause.failureOption(exit.cause);

  if (failure._tag === 'Some') {
    const actualError = failure.value;

    if (
      actualError instanceof NotFoundError ||
      actualError instanceof ConflictError ||
      actualError instanceof UnauthorizedError ||
      actualError instanceof ForbiddenError ||
      actualError instanceof InternalError
    ) {
      throw new TRPCError({
        code: mapErrorToTRPCCode(actualError),
        message: actualError.message,
        cause: actualError.cause,
      });
    }
  }

  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unknown error occurred',
    cause: Cause.pretty(exit.cause),
  });
}
