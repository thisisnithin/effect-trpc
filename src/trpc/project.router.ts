import { z } from 'zod';
import { ProjectService } from '../services/ProjectService.js';
import { publicProcedure, router, run } from './trpc.js';

export const projectRouter = router({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Name is required'),
        description: z.string().optional(),
      }),
    )
    .mutation(
      run(function* ({ input }) {
        const projectService = yield* ProjectService;
        return yield* projectService.create(input);
      }),
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
    .mutation(
      run(function* ({ input }) {
        const projectService = yield* ProjectService;
        return yield* projectService.createWithTodos(input);
      }),
    ),

  getAll: publicProcedure.query(
    run(function* () {
      const projectService = yield* ProjectService;
      return yield* projectService.getAll();
    }),
  ),

  getById: publicProcedure.input(z.number()).query(
    run(function* ({ input }) {
      const projectService = yield* ProjectService;
      return yield* projectService.getById(input);
    }),
  ),

  getWithTodos: publicProcedure.input(z.number()).query(
    run(function* ({ input }) {
      const projectService = yield* ProjectService;
      return yield* projectService.getWithTodos(input);
    }),
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
    .mutation(
      run(function* ({ input }) {
        const projectService = yield* ProjectService;
        return yield* projectService.update(input.id, input.data);
      }),
    ),

  delete: publicProcedure.input(z.number()).mutation(
    run(function* ({ input }) {
      const projectService = yield* ProjectService;
      return yield* projectService.delete(input);
    }),
  ),
});
