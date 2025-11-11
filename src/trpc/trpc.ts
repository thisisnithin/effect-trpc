import { initTRPC } from '@trpc/server';
import { Effect, type Runtime } from 'effect';
import { withErrorHandling } from './error-handler.js';

const t = initTRPC.context<{ runtime: Runtime.Runtime<any> }>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export function run<
  TParams extends { ctx: { runtime: Runtime.Runtime<any> } },
  A,
>(
  genFactory: (
    params: Omit<TParams, 'ctx'> & { ctx: Omit<TParams['ctx'], 'runtime'> },
  ) => Generator<any, A, never>,
) {
  return (params: TParams): Promise<A> => {
    const { runtime, ...ctxRest } = params.ctx as any;
    const cleanParams = { ...params, ctx: ctxRest } as any;
    const effect = Effect.gen(() => genFactory(cleanParams));
    return withErrorHandling(runtime, effect);
  };
}
