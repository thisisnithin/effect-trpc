import { ProjectGroup } from '@repo/rpc';
import { Effect } from 'effect';
import { withErrorHandling } from '../error-handler';
import { ProjectService } from '../services/ProjectService';

export const ProjectLive = ProjectGroup.toLayer(
  Effect.gen(function* () {
    const projectService = yield* ProjectService;

    return ProjectGroup.of({
      ProjectCreate: ({ name, description }) => {
        return withErrorHandling(
          Effect.as(projectService.create({ name, description }), undefined),
        );
      },

      ProjectCreateWithTodos: ({ name, description, todos }) => {
        return withErrorHandling(
          Effect.as(
            projectService.createWithTodos({
              name,
              description,
              todos: [...todos],
            }),
            undefined,
          ),
        );
      },

      ProjectGetAll: () => {
        return withErrorHandling(projectService.getAll());
      },

      ProjectGetById: ({ id }) => {
        return withErrorHandling(projectService.getById(id));
      },

      ProjectGetWithTodos: ({ id }) => {
        return withErrorHandling(projectService.getWithTodos(id));
      },

      ProjectUpdate: ({ id, data }) => {
        return withErrorHandling(
          Effect.as(projectService.update(id, data), undefined),
        );
      },

      ProjectDelete: ({ id }) => {
        return withErrorHandling(
          Effect.as(projectService.delete(id), undefined),
        );
      },
    });
  }),
);
