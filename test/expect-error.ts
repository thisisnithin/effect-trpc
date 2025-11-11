import type { TRPCClientErrorLike } from '@trpc/client';
import type { TRPC_ERROR_CODE_KEY } from '@trpc/server/rpc';
import { Either } from 'effect';
import { expect } from 'vitest';
import type { AppRouter } from '../src/trpc/router.js';

type ErrorCode = TRPC_ERROR_CODE_KEY;

type LeftError = {
  error: TRPCClientErrorLike<AppRouter>;
};

function getErrorCode(
  result: Either.Either<unknown, unknown>,
): string | undefined {
  if (result._tag === 'Left') {
    const leftError = result.left as LeftError;
    return leftError.error.data?.code;
  }
  return undefined;
}

export function expectNotFound(result: Either.Either<unknown, unknown>) {
  const code = getErrorCode(result);
  expect(code).toBe('NOT_FOUND' satisfies ErrorCode);
}

export function expectConflict(result: Either.Either<unknown, unknown>) {
  const code = getErrorCode(result);
  expect(code).toBe('CONFLICT' satisfies ErrorCode);
}

export function expectUnauthorized(result: Either.Either<unknown, unknown>) {
  const code = getErrorCode(result);
  expect(code).toBe('UNAUTHORIZED' satisfies ErrorCode);
}

export function expectForbidden(result: Either.Either<unknown, unknown>) {
  const code = getErrorCode(result);
  expect(code).toBe('FORBIDDEN' satisfies ErrorCode);
}

export function expectInternalError(result: Either.Either<unknown, unknown>) {
  const code = getErrorCode(result);
  expect(code).toBe('INTERNAL_SERVER_ERROR' satisfies ErrorCode);
}
