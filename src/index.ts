import { BunRuntime } from '@effect/platform-bun';
import { Effect, Layer } from 'effect';
import { DbLive } from './db/client.js';
import { LoggerLive } from './logger.js';
import { HttpLive } from './server.js';
import { ProjectService } from './services/ProjectService.js';
import { TodoService } from './services/TodoService.js';

export const AppLive = HttpLive.pipe(
  Layer.provide(ProjectService.Default),
  Layer.provide(TodoService.Default),
  Layer.provide(DbLive),
  Layer.provide(LoggerLive),
);

const program = Effect.gen(function* () {
  yield* Effect.log('Server starting on http://localhost:3000');
  yield* Effect.log('Health check available at http://localhost:3000/health');
  yield* Effect.log('tRPC endpoint available at http://localhost:3000/trpc');
  yield* Effect.never;
}).pipe(Effect.provide(AppLive));

BunRuntime.runMain(program, {
  disablePrettyLogger: true,
  disableErrorReporting: false,
});
