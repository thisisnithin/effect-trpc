import { TodoNotFoundError } from '@repo/rpc';
import { and, eq, gt } from 'drizzle-orm';
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
    }) => {
      return Effect.gen(function* () {
        const now = new Date();
        const result = yield* db
          .insert(schema.todos)
          .values({
            projectId: input.projectId,
            title: input.title,
            description: input.description,
            completed: false,
            createdAt: now,
            updatedAt: now,
          })
          .returning();
        return result[0];
      });
    };

    const getAll = () => {
      return Effect.gen(function* () {
        return yield* db.select().from(schema.todos);
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

    const getById = (id: number) => {
      return Effect.gen(function* () {
        const result = yield* db
          .select()
          .from(schema.todos)
          .where(eq(schema.todos.id, id));
        if (result.length === 0) {
          return yield* Effect.fail(new TodoNotFoundError({ id }));
        }
        return result[0];
      });
    };

    const update = (
      id: number,
      input: { title?: string; description?: string; completed?: boolean },
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

    const toggle = (id: number) => {
      return Effect.gen(function* () {
        const existing = yield* getById(id);
        const result = yield* db
          .update(schema.todos)
          .set({
            completed: !existing.completed,
            updatedAt: new Date(),
          })
          .where(eq(schema.todos.id, id))
          .returning();
        return result[0];
      });
    };

    const getByProjectIdPaginated = (
      projectId: number,
      cursor: number,
      limit: number,
    ) => {
      return Effect.gen(function* () {
        const todos = yield* db
          .select()
          .from(schema.todos)
          .where(
            cursor > 0
              ? and(
                  eq(schema.todos.projectId, projectId),
                  gt(schema.todos.id, cursor),
                )
              : eq(schema.todos.projectId, projectId),
          )
          .limit(limit + 1)
          .orderBy(schema.todos.id);

        const hasMore = todos.length > limit;
        const items = hasMore ? todos.slice(0, limit) : todos;
        const nextCursor = hasMore ? items[items.length - 1].id : null;

        return {
          todos: items,
          nextCursor,
        };
      });
    };

    return {
      create,
      getAll,
      getById,
      getByProjectId,
      getByProjectIdPaginated,
      update,
      delete: deleteTodo,
      toggle,
    };
  }),
}) {}
