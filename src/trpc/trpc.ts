import { initTRPC } from '@trpc/server';
import type { Effect, Runtime } from 'effect';
import { runEffectInTRPC } from './error-handler.js';

const t = initTRPC.context<{ runtime: Runtime.Runtime<any> }>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const runEffect = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  runtime: Runtime.Runtime<R>,
): Promise<A> => {
  return runEffectInTRPC(runtime, effect);
};
