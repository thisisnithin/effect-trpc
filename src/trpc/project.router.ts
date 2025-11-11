import { Effect } from 'effect';
import { z } from 'zod';
import { ProjectService } from '../services/ProjectService.js';
import { publicProcedure, router, runEffect } from './trpc.js';

export const projectRouter = router({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Name is required'),
        description: z.string().optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      runEffect(
        Effect.gen(function* () {
          const projectService = yield* ProjectService;
          return yield* projectService.create(input);
        }),
        ctx.runtime,
      ),
    ),

  createWithTodos: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Name is required'),
        description: z.string().optional(),
        todos: z.array(
          z.object({
            title: z.string().min(1, 'Title is required'),
            description: z.string().optional(),
          }),
        ),
      }),
    )
    .mutation(({ input, ctx }) =>
      runEffect(
        Effect.gen(function* () {
          const projectService = yield* ProjectService;
          return yield* projectService.createWithTodos(input);
        }),
        ctx.runtime,
      ),
    ),

  getAll: publicProcedure.query(({ ctx }) =>
    runEffect(
      Effect.gen(function* () {
        const projectService = yield* ProjectService;
        return yield* projectService.getAll();
      }),
      ctx.runtime,
    ),
  ),

  getById: publicProcedure.input(z.number()).query(({ input, ctx }) =>
    runEffect(
      Effect.gen(function* () {
        const projectService = yield* ProjectService;
        return yield* projectService.getById(input);
      }),
      ctx.runtime,
    ),
  ),

  getWithTodos: publicProcedure.input(z.number()).query(({ input, ctx }) =>
    runEffect(
      Effect.gen(function* () {
        const projectService = yield* ProjectService;
        return yield* projectService.getWithTodos(input);
      }),
      ctx.runtime,
    ),
  ),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().min(1).optional(),
          description: z.string().optional(),
        }),
      }),
    )
    .mutation(({ input, ctx }) =>
      runEffect(
        Effect.gen(function* () {
          const projectService = yield* ProjectService;
          return yield* projectService.update(input.id, input.data);
        }),
        ctx.runtime,
      ),
    ),

  delete: publicProcedure.input(z.number()).mutation(({ input, ctx }) =>
    runEffect(
      Effect.gen(function* () {
        const projectService = yield* ProjectService;
        return yield* projectService.delete(input);
      }),
      ctx.runtime,
    ),
  ),
});
