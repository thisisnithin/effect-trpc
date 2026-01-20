import {
  HttpMiddleware,
  HttpRouter,
  HttpServer,
  HttpServerResponse,
} from '@effect/platform';
import { BunHttpServer } from '@effect/platform-bun';
import { RpcSerialization, RpcServer } from '@effect/rpc';
import { AppRouter } from '@repo/rpc';
import { Effect, Layer } from 'effect';
import { ProjectLive } from './handlers/project-handlers';
import { TodoLive } from './handlers/todo-handlers';

export const HandlersLive = Layer.mergeAll(ProjectLive, TodoLive);

export const ServerLive = Layer.unwrapScoped(
  Effect.gen(function* () {
    const rpcApp = yield* RpcServer.toHttpApp(AppRouter);

    const router = HttpRouter.empty.pipe(
      HttpRouter.get('/health', Effect.succeed(HttpServerResponse.text('OK'))),
      HttpRouter.post('/rpc', rpcApp),
      HttpMiddleware.cors(),
    );

    return HttpServer.serve(router);
  }),
);

export const HttpLive = ServerLive.pipe(
  Layer.provide(HandlersLive),
  Layer.provide(RpcSerialization.layerJson),
  Layer.provide(BunHttpServer.layer({ port: 3000 })),
);
