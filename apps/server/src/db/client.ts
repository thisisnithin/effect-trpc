import * as PgDrizzle from '@effect/sql-drizzle/Pg';
import { PgClient } from '@effect/sql-pg';
import { Effect, Layer, Redacted } from 'effect';
import { AppConfig } from '../config';

const SqlLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const config = yield* AppConfig;
    return PgClient.layer({
      url: Redacted.make(config.dbUrl),
    });
  }),
);

const DrizzleLayer = PgDrizzle.layer.pipe(Layer.provide(SqlLive));

export class Db extends Effect.Service<Db>()('Db', {
  effect: Effect.gen(function* () {
    return yield* PgDrizzle.PgDrizzle;
  }),
  dependencies: [DrizzleLayer],
}) {}

export const DbLive = Layer.merge(SqlLive, Db.Default);
