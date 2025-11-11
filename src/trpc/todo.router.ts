import { z } from 'zod';
import { TodoService } from '../services/TodoService.js';
import { publicProcedure, router, run } from './trpc.js';

export const todoRouter = router({
  create: publicProcedure
    .input(
      z.object({
        projectId: z.number(),
        title: z.string().min(1, 'Title is required'),
        description: z.string().optional(),
      }),
    )
    .mutation(
      run(function* ({ input }) {
        const todoService = yield* TodoService;
        return yield* todoService.create(input);
      }),
    ),

  getAll: publicProcedure.query(
    run(function* () {
      const todoService = yield* TodoService;
      return yield* todoService.getAll();
    }),
  ),

  getByProjectId: publicProcedure.input(z.number()).query(
    run(function* ({ input }) {
      const todoService = yield* TodoService;
      return yield* todoService.getByProjectId(input);
    }),
  ),

  getById: publicProcedure.input(z.number()).query(
    run(function* ({ input }) {
      const todoService = yield* TodoService;
      return yield* todoService.getById(input);
    }),
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
    .mutation(
      run(function* ({ input }) {
        const todoService = yield* TodoService;
        return yield* todoService.update(input.id, input.data);
      }),
    ),

  delete: publicProcedure.input(z.number()).mutation(
    run(function* ({ input }) {
      const todoService = yield* TodoService;
      return yield* todoService.delete(input);
    }),
  ),

  toggle: publicProcedure.input(z.number()).mutation(
    run(function* ({ input }) {
      const todoService = yield* TodoService;
      return yield* todoService.toggle(input);
    }),
  ),
});
