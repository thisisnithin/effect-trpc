import { SqlClient } from '@effect/sql';
import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import { ProjectNotFoundError } from '@repo/rpc';
import { Db } from '../db/client';
import * as schema from '../db/schema';
import { TodoService } from './TodoService';

export class ProjectService extends Effect.Service<ProjectService>()(
  'ProjectService',
  {
    effect: Effect.gen(function* () {
      const db = yield* Db;
      const todoService = yield* TodoService;
      const sql = yield* SqlClient.SqlClient;

      const create = (input: { name: string; description?: string }) => {
        return Effect.gen(function* () {
          const now = new Date();
          const result = yield* db
            .insert(schema.projects)
            .values({
              name: input.name,
              description: input.description,
              createdAt: now,
              updatedAt: now,
            })
            .returning();
          return result[0];
        });
      };

      const createWithTodos = (input: {
        name: string;
        description?: string;
        todos: Array<{ title: string; description?: string }>;
      }) => {
        return sql.withTransaction(
          Effect.gen(function* () {
            // Create project
            const now = new Date();
            const projectResult = yield* db
              .insert(schema.projects)
              .values({
                name: input.name,
                description: input.description,
                createdAt: now,
                updatedAt: now,
              })
              .returning();
            const project = projectResult[0];

            // Create todos for the project
            const todos: schema.Todo[] = [];
            for (const todoInput of input.todos) {
              const todo = yield* todoService.create({
                projectId: project.id,
                title: todoInput.title,
                description: todoInput.description,
              });
              todos.push(todo);
            }

            return {
              project,
              todos,
            };
          }),
        );
      };

      const getAll = () => {
        return Effect.gen(function* () {
          return yield* db.select().from(schema.projects);
        });
      };

      const getById = (id: number) => {
        return Effect.gen(function* () {
          const result = yield* db
            .select()
            .from(schema.projects)
            .where(eq(schema.projects.id, id));
          if (result.length === 0) {
            return yield* Effect.fail(new ProjectNotFoundError({ id }));
          }
          return result[0];
        });
      };

      const getWithTodos = (id: number) => {
        return Effect.gen(function* () {
          const project = yield* getById(id);
          const todos = yield* todoService.getByProjectId(id);
          return {
            project,
            todos,
          };
        });
      };

      const update = (
        id: number,
        input: { name?: string; description?: string },
      ) => {
        return Effect.gen(function* () {
          const result = yield* db
            .update(schema.projects)
            .set({
              ...input,
              updatedAt: new Date(),
            })
            .where(eq(schema.projects.id, id))
            .returning();
          if (result.length === 0) {
            return yield* Effect.fail(new ProjectNotFoundError({ id }));
          }
          return result[0];
        });
      };

      const deleteProject = (id: number) => {
        return Effect.gen(function* () {
          const result = yield* db
            .delete(schema.projects)
            .where(eq(schema.projects.id, id))
            .returning();
          if (result.length === 0) {
            return yield* Effect.fail(new ProjectNotFoundError({ id }));
          }
          return { success: true, id };
        });
      };

      return {
        create,
        createWithTodos,
        getAll,
        getById,
        getWithTodos,
        update,
        delete: deleteProject,
      };
    }),
  },
) {}
