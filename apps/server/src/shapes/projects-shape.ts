import { eq } from 'drizzle-orm';
import { projects } from '../db/schema';
import { createShapeHandler } from './shape-utils';

export const projectsShapeHandler = createShapeHandler(
  projects,
  (queryParams) => {
    const projectId = queryParams.get('projectId');
    return projectId ? eq(projects.id, Number(projectId)) : null;
  },
);
