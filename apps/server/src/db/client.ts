import * as SqliteDrizzle from '@effect/sql-drizzle/Sqlite';
import { SqliteClient } from '@effect/sql-sqlite-bun';
import { Effect, Layer } from 'effect';
import { AppConfig } from '../config';

const SqlLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const config = yield* AppConfig;
    const layer = SqliteClient.layer({
      filename: config.dbPath,
    });

    return Layer.effectDiscard(
      Effect.gen(function* () {
        const client = yield* SqliteClient.SqliteClient;
        yield* client.unsafe('PRAGMA foreign_keys = ON');
      }),
    ).pipe(Layer.provideMerge(layer));
  }),
);

const DrizzleLayer = SqliteDrizzle.layer.pipe(Layer.provide(SqlLive));

export class Db extends Effect.Service<Db>()('Db', {
  effect: Effect.gen(function* () {
    return yield* SqliteDrizzle.SqliteDrizzle;
  }),
  dependencies: [DrizzleLayer],
}) {}

export const DbLive = Layer.merge(SqlLive, Db.Default);
