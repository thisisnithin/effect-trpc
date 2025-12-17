import { SqlClient } from '@effect/sql';
import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import { ProjectNotFoundError } from '@repo/rpc';
import { Db } from '../db/client';
import * as schema from '../db/schema';

export class ProjectService extends Effect.Service<ProjectService>()(
  'ProjectService',
  {
    effect: Effect.gen(function* () {
      const db = yield* Db;

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

      const update = (id: number, input: { name?: string; description?: string }) => {
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
        getAll,
        getById,
        update,
        delete: deleteProject,
      };
    }),
  },
) {}
