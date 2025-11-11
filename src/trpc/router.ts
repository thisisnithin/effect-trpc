import { projectRouter } from './project.router.js';
import { todoRouter } from './todo.router.js';
import { router } from './trpc.js';

export const appRouter = router({
  project: projectRouter,
  todo: todoRouter,
});

export type AppRouter = typeof appRouter;
