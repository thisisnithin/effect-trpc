import { FileSystem } from '@effect/platform';
import { BunFileSystem, BunHttpServer } from '@effect/platform-bun';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { Database } from 'bun:sqlite';
import { pushSQLiteSchema } from 'drizzle-kit/api';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Cause, ConfigProvider, Effect, Fiber, Layer, Schedule } from 'effect';
import getPort from 'get-port';
import { DbLive } from '../src/db/client.js';
import * as schema from '../src/db/schema.js';
import { LoggerLive } from '../src/logger.js';
import { ServerLive } from '../src/server.js';
import { ProjectService } from '../src/services/ProjectService.js';
import { TodoService } from '../src/services/TodoService.js';
import type { AppRouter } from '../src/trpc/router.js';

export function runTest<A>(f: () => Generator<any, A, any>): () => Promise<A> {
  return async (): Promise<A> => {
    const exit = await Effect.runPromiseExit(
      Effect.scoped(Effect.gen(f as any)) as any,
    );

    if (exit._tag === 'Success') {
      return exit.value as A;
    }

    const defect = Cause.dieOption(exit.cause);
    if (defect._tag === 'Some') {
      throw defect.value;
    }

    throw new Error(Cause.pretty(exit.cause));
  };
}

async function silently<T>(fn: () => Promise<T>): Promise<T> {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWrite = process.stdout.write;
  const originalErrWrite = process.stderr.write;

  console.log = () => {};
  console.error = () => {};
  process.stdout.write = () => true;
  process.stderr.write = () => true;

  try {
    return await fn();
  } finally {
    console.log = originalLog;
    console.error = originalError;
    process.stdout.write = originalWrite;
    process.stderr.write = originalErrWrite;
  }
}

export function startTestServer() {
  return Effect.gen(function* () {
    const port = yield* Effect.promise(() => getPort());

    const fs = yield* FileSystem.FileSystem;
    yield* fs.makeDirectory('./junk', { recursive: true }).pipe(Effect.ignore);
    const testDbPath = `./junk/test-${Date.now()}.db`;

    const ConfigTest = Layer.setConfigProvider(
      ConfigProvider.fromJson({
        LOG_LEVEL: 'Error',
        NODE_ENV: 'test',
        DB_PATH: testDbPath,
      }),
    );

    yield* Effect.promise(async () => {
      const sqlite = new Database(testDbPath);
      const db = drizzle(sqlite);
      try {
        await silently(async () => {
          const pushResult = await pushSQLiteSchema(schema, db as any);
          await pushResult.apply();
        });
      } finally {
        sqlite.close();
      }
    });

    const AppTest = ServerLive.pipe(
      Layer.provide(ProjectService.Default),
      Layer.provide(TodoService.Default),
      Layer.provide(DbLive),
      Layer.provide(LoggerLive),
      Layer.provide(BunHttpServer.layer({ port })),
      Layer.provide(ConfigTest),
    );

    const fiber = yield* Effect.never.pipe(
      Effect.provide(AppTest),
      Effect.fork,
    );

    yield* Effect.addFinalizer(() =>
      Effect.gen(function* () {
        yield* Fiber.interrupt(fiber).pipe(Effect.asVoid, Effect.orDie);
        const fs = yield* FileSystem.FileSystem;
        yield* Effect.all(
          [
            fs.remove(testDbPath),
            fs.remove(`${testDbPath}-shm`),
            fs.remove(`${testDbPath}-wal`),
          ],
          { concurrency: 'unbounded' },
        ).pipe(Effect.ignore);
      }),
    );

    yield* Effect.retry(
      Effect.gen(function* () {
        const response = yield* Effect.tryPromise({
          try: () => fetch(`http://localhost:${port}/health`),
          catch: () => new Error('Health check failed'),
        });
        if (!response.ok) {
          yield* Effect.fail(new Error('Health check returned non-OK status'));
        }
      }),
      {
        schedule: Schedule.exponential('50 millis').pipe(
          Schedule.intersect(Schedule.recurs(20)),
        ),
      },
    );

    const client = createTRPCProxyClient<AppRouter>({
      links: [httpBatchLink({ url: `http://localhost:${port}/trpc` })],
    });

    return { client, port };
  }).pipe(Effect.provide(BunFileSystem.layer));
}
