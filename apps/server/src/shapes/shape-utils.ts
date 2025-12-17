import { HttpServerRequest, HttpServerResponse } from '@effect/platform';
import type { SQL } from 'drizzle-orm';
import { getTableName } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { Effect, Stream } from 'effect';
import { AppConfig } from '../config';

const ALLOWED_ELECTRIC_PARAMS = [
  'handle',
  'offset',
  'live',
  'cursor',
  'log',
] as const;

export function compileWhereClause(
  table: PgTable,
  whereExpr: SQL<unknown>,
): string {
  const qb = new QueryBuilder();
  const { sql: query, params } = qb
    .select()
    .from(table)
    .where(whereExpr)
    .toSQL();

  let fragment = query.replace(/^SELECT .* FROM .* WHERE\s+/i, '');

  params.forEach((value, index) => {
    const placeholder = `$${index + 1}`;
    const inlineValue =
      typeof value === 'string'
        ? `'${value.replace(/'/g, "''")}'`
        : String(value);
    fragment = fragment.replace(placeholder, inlineValue);
  });

  const tableName = getTableName(table);
  fragment = fragment.replace(new RegExp(`"${tableName}"\\.`, 'g'), '');

  return fragment;
}

export function createShapeHandler(
  table: PgTable,
  buildWhereExpr?: (queryParams: URLSearchParams) => SQL<unknown> | null,
) {
  return HttpServerRequest.HttpServerRequest.pipe(
    Effect.flatMap((request) =>
      Effect.gen(function* () {
        const config = yield* AppConfig;
        const url = new URL(request.url, 'http://localhost');
        const queryParams = url.searchParams;

        const electricUrl = new URL(`${config.electricUrl}/v1/shape`);
        const tableName = getTableName(table);
        electricUrl.searchParams.set('table', tableName);

        if (buildWhereExpr) {
          const whereExpr = buildWhereExpr(queryParams);
          if (whereExpr) {
            const whereClause = compileWhereClause(table, whereExpr);
            electricUrl.searchParams.set('where', whereClause);
          }
        }

        ALLOWED_ELECTRIC_PARAMS.forEach((param) => {
          const value = queryParams.get(param);
          if (value !== null) {
            electricUrl.searchParams.set(param, value);
          }
        });

        const response = yield* Effect.tryPromise(() =>
          fetch(electricUrl.toString(), {
            method: request.method,
            headers: request.headers as Record<string, string>,
          }),
        );

        if (!response.ok) {
          return HttpServerResponse.empty({ status: response.status });
        }

        if (!response.body) {
          return HttpServerResponse.empty({ status: 500 });
        }

        const stream = Stream.fromReadableStream(
          () => response.body as ReadableStream<Uint8Array>,
          (error) => new Error(String(error)),
        );

        return HttpServerResponse.stream(stream, {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
        });
      }),
    ),
  );
}
