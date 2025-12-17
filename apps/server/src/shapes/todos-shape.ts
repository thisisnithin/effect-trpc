import { eq } from 'drizzle-orm';
import { todos } from '../db/schema';
import { createShapeHandler } from './shape-utils';

export const todosShapeHandler = createShapeHandler(todos, (queryParams) => {
  const projectId = queryParams.get('projectId');
  return projectId ? eq(todos.projectId, Number(projectId)) : null;
});
