import * as SqliteDrizzle from '@effect/sql-drizzle/Sqlite';
import { SqliteClient } from '@effect/sql-sqlite-bun';
import { Effect, Layer } from 'effect';
import { AppConfig } from '../config.js';

const SqlLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const config = yield* AppConfig;
    return SqliteClient.layer({
      filename: config.dbPath,
    });
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
