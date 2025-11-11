import { Effect } from 'effect';
import { z } from 'zod';
import { TodoService } from '../services/TodoService.js';
import { publicProcedure, router, runEffect } from './trpc.js';

export const todoRouter = router({
  create: publicProcedure
    .input(
      z.object({
        projectId: z.number(),
        title: z.string().min(1, 'Title is required'),
        description: z.string().optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      runEffect(
        Effect.gen(function* () {
          const todoService = yield* TodoService;
          return yield* todoService.create(input);
        }),
        ctx.runtime,
      ),
    ),

  getAll: publicProcedure.query(({ ctx }) =>
    runEffect(
      Effect.gen(function* () {
        const todoService = yield* TodoService;
        return yield* todoService.getAll();
      }),
      ctx.runtime,
    ),
  ),

  getByProjectId: publicProcedure.input(z.number()).query(({ input, ctx }) =>
    runEffect(
      Effect.gen(function* () {
        const todoService = yield* TodoService;
        return yield* todoService.getByProjectId(input);
      }),
      ctx.runtime,
    ),
  ),

  getById: publicProcedure.input(z.number()).query(({ input, ctx }) =>
    runEffect(
      Effect.gen(function* () {
        const todoService = yield* TodoService;
        return yield* todoService.getById(input);
      }),
      ctx.runtime,
    ),
  ),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          completed: z.boolean().optional(),
        }),
      }),
    )
    .mutation(({ input, ctx }) =>
      runEffect(
        Effect.gen(function* () {
          const todoService = yield* TodoService;
          return yield* todoService.update(input.id, input.data);
        }),
        ctx.runtime,
      ),
    ),

  delete: publicProcedure.input(z.number()).mutation(({ input, ctx }) =>
    runEffect(
      Effect.gen(function* () {
        const todoService = yield* TodoService;
        return yield* todoService.delete(input);
      }),
      ctx.runtime,
    ),
  ),

  toggle: publicProcedure.input(z.number()).mutation(({ input, ctx }) =>
    runEffect(
      Effect.gen(function* () {
        const todoService = yield* TodoService;
        return yield* todoService.toggle(input);
      }),
      ctx.runtime,
    ),
  ),
});
