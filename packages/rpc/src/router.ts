import { ProjectGroup } from './routes/project';
import { TodoGroup } from './routes/todo';

export const AppRouter = ProjectGroup.merge(TodoGroup);
