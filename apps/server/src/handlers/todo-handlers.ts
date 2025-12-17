import { TodoGroup } from '@repo/rpc';
import { Effect } from 'effect';
import { withErrorHandling } from '../error-handler';
import { TodoService } from '../services/TodoService';

export const TodoLive = TodoGroup.toLayer(
  Effect.gen(function* () {
    const todoService = yield* TodoService;

    return TodoGroup.of({
      TodoCreate: ({ projectId, title, description, status }) => {
        return withErrorHandling(
          Effect.as(
            todoService.create({ projectId, title, description, status }),
            undefined,
          ),
        );
      },

      TodoGetByProjectId: ({ projectId }) => {
        return withErrorHandling(todoService.getByProjectId(projectId));
      },

      TodoGetAll: () => {
        return withErrorHandling(todoService.getAll());
      },

      TodoUpdate: ({ id, data }) => {
        return withErrorHandling(
          Effect.as(todoService.update(id, data), undefined),
        );
      },

      TodoDelete: ({ id }) => {
        return withErrorHandling(Effect.as(todoService.delete(id), undefined));
      },
    });
  }),
);
