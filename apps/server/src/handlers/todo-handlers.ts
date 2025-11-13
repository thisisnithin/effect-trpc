import { TodoGroup } from '@repo/rpc';
import { Effect } from 'effect';
import { withErrorHandling } from '../error-handler';
import { TodoService } from '../services/TodoService';

export const TodoLive = TodoGroup.toLayer(
  Effect.gen(function* () {
    const todoService = yield* TodoService;

    return TodoGroup.of({
      TodoCreate: ({ projectId, title, description }) => {
        return withErrorHandling(
          Effect.as(
            todoService.create({ projectId, title, description }),
            undefined,
          ),
        );
      },

      TodoGetAll: () => {
        return withErrorHandling(todoService.getAll());
      },

      TodoGetByProjectId: ({ projectId }) => {
        return withErrorHandling(todoService.getByProjectId(projectId));
      },

      TodoGetById: ({ id }) => {
        return withErrorHandling(todoService.getById(id));
      },

      TodoUpdate: ({ id, data }) => {
        return withErrorHandling(
          Effect.as(todoService.update(id, data), undefined),
        );
      },

      TodoDelete: ({ id }) => {
        return withErrorHandling(Effect.as(todoService.delete(id), undefined));
      },

      TodoToggle: ({ id }) => {
        return withErrorHandling(Effect.as(todoService.toggle(id), undefined));
      },

      TodoGetByProjectIdPaginated: ({ projectId, cursor, limit = 10 }) => {
        return withErrorHandling(
          todoService.getByProjectIdPaginated(projectId, cursor ?? 0, limit),
        );
      },
    });
  }),
);
