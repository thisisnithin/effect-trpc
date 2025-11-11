import {
  HttpRouter,
  HttpServer,
  HttpServerRequest,
  HttpServerResponse,
} from '@effect/platform';
import { BunHttpServer } from '@effect/platform-bun';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { Effect, Layer } from 'effect';
import { createContext } from './trpc/context.js';
import { appRouter } from './trpc/router.js';

export const ServerLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const runtime = yield* Effect.runtime();

    const router = HttpRouter.empty.pipe(
      HttpRouter.get('/health', Effect.succeed(HttpServerResponse.text('OK'))),

      HttpRouter.all(
        '/trpc/*',
        Effect.gen(function* () {
          const req = yield* HttpServerRequest.HttpServerRequest;
          const body =
            req.method !== 'GET' && req.method !== 'HEAD'
              ? yield* req.text
              : undefined;

          const response = yield* Effect.promise(() =>
            fetchRequestHandler({
              endpoint: '/trpc',
              req: new Request(
                new URL(req.url, 'http://localhost:3000').toString(),
                {
                  method: req.method,
                  headers: req.headers,
                  body,
                },
              ),
              router: appRouter,
              createContext: () => createContext(runtime as any),
            }),
          );

          const text = yield* Effect.promise(() => response.text());
          return HttpServerResponse.text(text, {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
          });
        }),
      ),
    );

    return HttpServer.serve(router);
  }),
);

export const HttpLive = ServerLive.pipe(
  Layer.provide(BunHttpServer.layer({ port: 3000 })),
);
