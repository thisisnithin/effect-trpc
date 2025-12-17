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

      ProjectGetAll: () => {
        return withErrorHandling(projectService.getAll());
      },

      ProjectGetById: ({ id }) => {
        return withErrorHandling(projectService.getById(id));
      },

      ProjectDelete: ({ id }) => {
        return withErrorHandling(
          Effect.as(projectService.delete(id), undefined),
        );
      },
    });
  }),
);
