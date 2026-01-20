import { InternalError } from '@repo/rpc';
import { Effect } from 'effect';

export const withErrorHandling = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  effect.pipe(
    Effect.catchAll((error: any) =>
      error._tag === 'SqlError'
        ? Effect.gen(function* () {
            yield* Effect.logError('SQL error occurred', { error });
            return yield* Effect.fail(
              new InternalError({
                message: 'An internal error occurred',
              }),
            );
          })
        : Effect.fail(error),
    ),
  );
