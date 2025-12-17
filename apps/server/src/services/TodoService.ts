import { TodoNotFoundError, TodoStatus } from '@repo/rpc';
import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import { Db } from '../db/client';
import * as schema from '../db/schema';

export class TodoService extends Effect.Service<TodoService>()('TodoService', {
  effect: Effect.gen(function* () {
    const db = yield* Db;

    const create = (input: {
      projectId: number;
      title: string;
      description?: string;
      status: TodoStatus;
    }) => {
      return Effect.gen(function* () {
        const now = new Date();
        const result = yield* db
          .insert(schema.todos)
          .values({
            projectId: input.projectId,
            title: input.title,
            description: input.description,
            status: input.status,
            order: 0,
            createdAt: now,
            updatedAt: now,
          })
          .returning();
        return result[0] as unknown as typeof schema.todos.$inferSelect;
      });
    };

    const getByProjectId = (projectId: number) => {
      return Effect.gen(function* () {
        return yield* db
          .select()
          .from(schema.todos)
          .where(eq(schema.todos.projectId, projectId));
      });
    };

    const getAll = () => {
      return db.select().from(schema.todos);
    };

    const update = (
      id: number,
      input: {
        title?: string;
        description?: string;
        status?: TodoStatus;
        order?: number;
      },
    ) => {
      return Effect.gen(function* () {
        const result = yield* db
          .update(schema.todos)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(schema.todos.id, id))
          .returning();
        if (result.length === 0) {
          return yield* Effect.fail(new TodoNotFoundError({ id }));
        }
        return result[0];
      });
    };

    const deleteTodo = (id: number) => {
      return Effect.gen(function* () {
        const result = yield* db
          .delete(schema.todos)
          .where(eq(schema.todos.id, id))
          .returning();
        if (result.length === 0) {
          return yield* Effect.fail(new TodoNotFoundError({ id }));
        }
        return { success: true, id };
      });
    };

    return {
      create,
      getByProjectId,
      getAll,
      update,
      delete: deleteTodo,
    };
  }),
}) {}
